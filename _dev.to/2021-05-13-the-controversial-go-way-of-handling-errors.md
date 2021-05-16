# The controversial Go way of handling errors

The Go way of handling errors has been long criticized. I consider myself one of these people complaining about Go's way of handling errors.

A few years ago Rob Pike wrote a blog post called ["errors are values"](https://blog.golang.org/errors-are-values). If you write Go code you should check it out, really!

To cut a long story short, Rob Pike proposes we should wrap the error and have a method, and in subsequent calls, if the previous call has returned an error, we skip until the end, where we definitely check the error.

```go
type errWriter struct {
    w   io.Writer
    err error
}

func (ew *errWriter) write(buf []byte) {
    if ew.err != nil {
        return
    }
    _, ew.err = ew.w.Write(buf)
}

ew := &errWriter{w: fd}
ew.write(p0[a:b])
ew.write(p1[c:d])
ew.write(p2[e:f])
if ew.err != nil {
    return ew.err
}
```

So far, so good! So what?

I'm a proponent that you should treat your errors as values too, and Go does that, but, but... yeah, you know, there's always a BUT.

## Where we are?

I could spend the rest of this text explaining how other languages have solved that, and how Go could steal some ideas from them, but I won't! It's no use. I'd rather start a discussion: 

How can we do better? 

There's a Go 2 [proposal to simplify error handling](https://github.com/golang/go/issues/21161). Also, the [proposal of generics](https://blog.golang.org/generics-proposal) would allow us to deal with errors in different ways. But, remember the BUT?

How can we use what we have at hand AT THE MOMENT? How to improve this given the limitations we have right now?

Rob Pike's advice helps a bunch. IMHO, it still lacks a way of generalizing error handling.

What do I mean by that?

The `errWriter` example is dealing with a single action, executed many times in sequence. But what can we do with dependent heterogeneous tasks?

## A down-to-earth case

Let's grab a practical problem that is similar to what we normally deal with frequently. 

If you follow the [RabbitMQ tutorial](https://www.rabbitmq.com/tutorials/tutorial-one-go.html) to implement a publish/subscribe queue, you will end up with something quite close to this:

```go
// receiver.go
package main

import (
	"log"

	"github.com/streadway/amqp"
)

func main() {
	conn, err := amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
	if err != nil {
		log.Fatalf("%s: %s", "Failed to connect to RabbitMQ", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("%s: %s", "Failed to open a channel", err)
	}
	defer ch.Close()

	q, err := ch.QueueDeclare(
		"hello", // name
		false,   // durable
		false,   // delete when unused
		false,   // exclusive
		false,   // no-wait
		nil,     // arguments
	)
	if err != nil {
		log.Fatalf("%s: %s", "Failed to declare a queue", err)
	}

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		log.Fatalf("%s: %s", "Failed to register a consumer", err)
	}

	log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
	for d := range msgs {
		log.Printf("Received a message: %s", d.Body)
	}
}
```

The publisher is similar to the receiver, so I will skip it for now.

You see the multiple conditionals `if err != nil`?

## An attempt

My first idea: separate each task into functions. However, we still return success and error values and we continue with the same issue at hand.

Well, each piece of code is heavily dependent on the previous one, so why not represent it in a different way?

The first step is to encapsulate each part into its own context:

```go
type Dial struct {
	Conn *amqp.Connection
	Err  error
}

func (m *Dial) Do() error {
	m.Conn, m.Err = amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
	return m.Err
}

func main() {
	dial := new(Dial)
	err := dial.Do()
	if err != nil {
		log.Fatal(err)
	}
	defer dial.Conn.Close()

	// ...
}
```

Not much of a difference yet. Let's continue with Channel:

(To be brief, I will skip parts of code already shown above in the code below)

```go
type Channel struct {
	Dial *Dial
	Ch   *amqp.Channel
	Err  error
}

func (m *Channel) Do() error {
	if m.Dial.Err != nil {
                m.Err = m.Dial.Err
		return m.Dial.Err
	}
	m.Ch, m.Err = m.Dial.Conn.Channel()
	return m.Err
}

func main() {
	dial := new(Dial)
	dial.Do()
	channel := &Channel{Dial: dial}
	err := channel.Do()
	if err != nil {
		log.Fatal(err)
	}
	defer dial.Conn.Close()
	defer channel.Ch.Close()

	// ...
}
```

Now `Channel` depends directly on `Dial`. We can continue like that making all the subsequent steps depend on the previous one. This is feasible but we are moving the conditional inside every `Do` method. We can do better!

## An improved attempt

If you're paying attention diligently, you might have already spotted a pattern. 

Each step is being encapsulated into a struct that responds to a method `func() error`.

Let's give it a name, let's call it `Task`, and let's write a function `Do` that will execute each task, and proceed only if the previous call has not returned an error:

```go
type Task func() error

func Do(it ...Task) error {
	for _, fn := range it {
		if err := fn(); err != nil {
			return err
		}
	}
	return nil
}
```

This sort of thing allows us to implement "tasks" like this:

```go
func Dial() error { // ... }
func Channel() error { // ... }
func QueueDeclare() error { // ... }
func Consume() error { // ... }

Do(
	Dial,
	Channel,
	QueueDeclare,
	Consume,
)
```

It's much easier to rely on the error returned by each function on every step.

There's a really good reason to use a struct to keep the context of the task, and keeping the contract of the `Task` so simple on the previous example. Each task will return a different success value or just do something and be absent of errors, with no success value at all. Using a struct we can store values (success or error) in their own context, and refer to them later, without doing any trick with the type system.

## Wrapping up

Based on the contract between `Task` and `Do`, the receiver could be written like this:

```go
type Dial struct {
	Conn *amqp.Connection
}

func (m *Dial) Do() (err error) {
	m.Conn, err = amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
	return
}

type Channel struct {
	Dial *Dial
	Ch   *amqp.Channel
}

func (m *Channel) Do() (err error) {
	m.Ch, err = m.Dial.Conn.Channel()
	return
}

type QueueDeclare struct {
	Ch    *Channel
	Queue amqp.Queue
}

func (m *QueueDeclare) Do() (err error) {
	m.Queue, err = m.Ch.Ch.QueueDeclare(
		"hello", // name
		false,   // durable
		false,   // delete when unused
		false,   // exclusive
		false,   // no-wait
		nil,     // arguments
	)
	return
}

type Consume struct {
	Ch           *Channel
	QueueDeclare *QueueDeclare
	Messages     <-chan amqp.Delivery
}

func (m *Consume) Do() (err error) {
	m.Messages, err = m.Ch.Ch.Consume(
		m.QueueDeclare.Queue.Name, // queue
		"",                        // consumer
		true,                      // auto-ack
		false,                     // exclusive
		false,                     // no-local
		false,                     // no-wait
		nil,                       // args
	)
	return
}

func main() {
	dial := Dial{}
	channel := Channel{Dial: dial}
	queue := QueueDeclare{Ch: channel}
	consume := Consume{Ch: channel, QueueDeclare: queue}
	err := Do(
		dial.Do,
		channel.Do,
		queue.Do,
		consume.Do,
	)

	if err != nil {
		log.Fatal(err)
	}

	defer dial.Conn.Close()
	defer channel.Ch.Close()
	
	log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
	for d := range consume.Messages {
		log.Printf("Received a message: %s", d.Body)
	}
}
```

And here is the publisher:

```go
type Publish struct {
	Ch           *Channel
	QueueDeclare *QueueDeclare
}

func (m *Publish) Do() (err error) {
	body := "Hello World!"
	for v := range time.Tick(time.Second * 10) {
		msg := fmt.Sprintf("%s - %s", body, v)
		log.Println("sending message ->", msg)
		err = m.Ch.Ch.Publish(
			"",                        // exchange
			m.QueueDeclare.Queue.Name, // routing key
			false,                     // mandatory
			false,                     // immediate
			amqp.Publishing{
				ContentType: "text/plain",
				Body:        []byte(msg),
			})
		if err != nil {
			log.Fatalf("%s: %s", "Failed to publish a message", err)
		}
	}
	log.Printf(" [x] Sent %s", body)
	return
}

func main() {
	dial := Dial{}
	channel := Channel{Dial: dial}
	queue := QueueDeclare{Ch: channel}
	publish := Publish{Ch: channel, QueueDeclare: queue}
	err := Do(
		dial.Do,
		channel.Do,
		queue.Do,
		publish.Do,
	)
	
	if err != nil {
		log.Fatal(err)
	}

	defer dial.Conn.Close()
	defer channel.Ch.Close()
}
```

## Conclusion

If you would like to check some runnable code, have a look at the Github repository I created as a playground: https://github.com/hlmerscher/go-error-handling-playground

I extracted the `Task` and `Do` into a tiny library: https://github.com/hlmerscher/performer. It's so small that you could even steal the code with copy and paste and be done with it.

Can we do better? What do you think?

For writing scripts or small command-line applications, this approach could be cumbersome. However, for bigger applications, it starts to make a difference.

Thanks for reviewing, @tiagocesar! :)
