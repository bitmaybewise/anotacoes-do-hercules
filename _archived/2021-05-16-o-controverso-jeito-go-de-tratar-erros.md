---
layout: post
title:  "O controverso jeito Go de tratar erros"
date:   2021-05-16
tags: go, programming, bug, errors
---

Post publicado originalmente em [https://dev.to/hlmerscher/the-controversial-go-way-of-handling-errors-2ka1](https://dev.to/hlmerscher/the-controversial-go-way-of-handling-errors-2ka1) (em inglês).

O jeito Go de lidar com erros tem sido criticado há tempos. Eu mesmo me considero uma dessas pessoas.

Alguns anos atrás Rob Pike escreveu um blog post chamado ["errors are values"](https://blog.golang.org/errors-are-values). Se você escreve código em Go, você deveria dar uma olhada, sério!

Resumindo, Rob Pike propõe que devemos encapsular o erro e ter um método, e em chamadas subsequentes, se a chamada anterior retornou um erro, ignoramos até o final, onde finalmente verificamos o erro.

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

Até aqui tudo bem! Então?

Eu sou um proponente de que devemos tratar erros como valores também, e Go faz isso, mas, mas... é, você sabe, tem sempre um MAS.

## Onde estamos?

Eu poderia passar o resto do texto explicando como outras linguagens resolveram isso, e como Go poderia copiar algumas ideias, mas eu não vou! Não vale a pena. Eu prefiro começar uma discussão:

Como podemos fazer melhor?

Existe uma [proposta para simplicar o tratamento de erros](https://github.com/golang/go/issues/21161). Também, uma [proposta para generics](https://blog.golang.org/generics-proposal) que nos permitiria tratar erros de diferentes maneiras. Mas, lembra do MAS?

Como podemos usar o que temos em mãos NO MOMENTO? Como podemos fazer melhor dada as correntes limitações que temos agora?

O conselho de Rob Pike ajuda bastante. Na minha humilde opinião, ainda falta um jeito de generalizar o tratamento de erros.

O que quero dizer com isso?

O exemplo do `errWriter` lida com uma única ação, executada múltiplas vezes em sequência. Mas o que nós podemos fazer com tarefas heterogêneas dependentes?

## Um caso prático

Vamos pegar um problema prático que é similar ao que nós normalmente lidamos com uma certa frequência.

Se você seguir o [tutorial do RabbitMQ](https://www.rabbitmq.com/tutorials/tutorial-one-go.html) para implementar uma fila de publish/subscribe, você vai acabar com algo bem próximo disso:

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
O código do publisher é similar ao do receiver, então vou ignorar por enquanto.

Percebe os múltiplos condicionais `if err != nil`?

## Uma tentativa

Minha primeira idea: separar cada tarefa em funções. Entretanto, nós ainda retornamos valores de sucesso e erro e nós continuamos com o mesmo problema em mãos.

Bem, cada pedaço de código é altamente dependente do anterior, então por que não representar isso de um jeito diferente?

O primeiro passo é encapsular cada parte em seu próprio contexto:

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

Sem grandes mudanças ainda. Vamos continuar com o Channel:

(Para ser breve, vou ignorar partes do código já apresentados)

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

Agora `Channel` depende diretamente de `Dial`. Podemos continuar fazendo isso com todos os passos subsequentes dependerem do anterior. Isso é viável mas nós estaremos movendo as condicionais para dentro do método `Do`. Nós podemos fazer melhor!

## Uma tentativa melhorada

Se está prestando atenção com diligência, você pode já ter notado um padrão.

Cada passo está encapsulado em uma struct que responde ao método `func() error`.

Vamos dar um nome, e chamar de `Task`, and escrever uma função `Do` que irá executar cada tarefa, and continuar somente se a chamada anterior não retornar erro:

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

Esse tipo de coisa nos permite implementar "tasks" assim:

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

É muito mais fácil confiar no erro retornado por cada função em cada passo.

Tem uma boa razão para usar a struct para manter o contexto da tarefa, e manter o contrato de `Task` assim tão simples no exemplo anterior. Cada tarefa irá retornar um valor de sucesso diferente ou somente fazer algo e retornar uma ausência de erros, sem nem mesmo um valor de sucesso. Usar uma struct nos permite guardar valores (sucesso ou erro) no seu próprio contexto, e referenciar eles depois, sem fazer nenhum malabarismo com o sistema de tipos.

## Finalizando

Baseado no contrato entre `Task` e `Do`, o receiver poderia ser escrito assim:

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

E aqui está o publisher:

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

## Conclusão

Se quiser verificar código executável, dê uma olhada no repositório que criei no Github como playground: [https://github.com/hlmerscher/go-error-handling-playground](https://github.com/hlmerscher/go-error-handling-playground)

Extraí `Task` e `Do` em uma minúscula biblioteca: [https://github.com/hlmerscher/performer](https://github.com/hlmerscher/performer). É tão pequena que você pode roubar a ideia e apenas copiar e colar no seu projeto.

E aí, podemos fazer melhor? O que acha?

Para escrever scripts ou pequenas aplicações de linha de comando, essa abordagem pode ser incômoda. Mas, vou continuar pensando em melhores maneiras de fazer gerenciamento de erros em Go.

Agradecimentos ao [@tiagocesar](https://dev.to/tiagocesar), por revisar o artigo original! :)
