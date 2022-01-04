# Beware mutation

Can you spot the problem here?

```javascript
let sum = 0;
for (i = 0; i < 10; i++) {
  setTimeout(() => (sum += i), 100);
}
setTimeout(() => console.log(sum), 1000);
```

It's supposed to print the sum of 0 to 9, but instead it's printing 100.

Well, it's not an exclusivity of Javascript. Have a look at this Go piece of code:

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	sum := 0
	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			time.Sleep(100)
			sum += i
			wg.Done()
		}()
	}
	wg.Wait()
	fmt.Println(sum)
}
```

The same "unexpected" behaviour! And it's the case for many other programming languages, give it a try with your favorite one.

Have you already grasped what's happening here? You may have already identified the issue, but in case not, try to think a little bit before proceeding if you like to solve this kind of thing.

## Unexpected 100?

Is it really unexpected? It's not, but sometimes it plays a tricky on us!

If you didn't grasp what's happening here yet, let me show you. The for loop uses a variable `i` that increases by 1 until it reaches 10. The loop code block is using the value of the variable to increase the `sum`, however, it's being done asynchrounously, turning it into a recipe for disaster. The code block has a sleep call, and since the loop goes much faster, by the time the variable `sum` is increased the variable `i` got mutated and is now storing the last value: `10`. This value is then summed up 10 times.

## Beware mutation

This is never a problem when you have synchrounous code, but the moment parallelism is introduced it starts behaving unexpectedly. Even worse if it has to do with concurrency, because that's when race conditions come to bite us.

## An easy fix

Don't fear! It's quite easy to fix this kind of thing:

```javascript
let sum = 0;
for (i = 0; i < 10; i++) {
  const value = i;
  setTimeout(() => (sum += value), 100);
}
setTimeout(() => console.log(sum), 1000);
```

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	sum := 0
	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		value := i
		wg.Add(1)
		go func() {
			time.Sleep(100)
			sum += value
			wg.Done()
		}()
	}
	wg.Wait()
	fmt.Println(sum)
}
```

A simple local variable will suffice to avoid the problem of sharing a mutable variable, since now every block will have a copy of the value itself.

## Concluding

My previous example is a silly case. Who wants to sum the loop counter, right? But it's not so uncommon to see code written like this:

```go
for i := 0; i < 100; i++ {
	go func() {
		sendEmail(users[i])
	}
}
```

You can change the `sendEmail` by any other function call doing I/O that you'd like to do in parallel to make it more efficient, and this is not the most idiomatic Go code, but translates well to other programming languages, which makes it perfect to illustrate the issue.