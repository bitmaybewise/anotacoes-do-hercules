---
layout: post
title:  "Cuidado com a mutabilidade"
date:   2022-01-04
tags: programming, mutation, bug, distributedsystems
---

# Cuidado com a mutabilidade

Consegue identificar o problema aqui?

```javascript
let sum = 0;
for (i = 0; i < 10; i++) {
  setTimeout(() => (sum += i), 100);
}
setTimeout(() => console.log(sum), 1000);
```

Deveria estar imprimindo a soma de 0 a 9, mas ao invés está imprimindo 100.

Bom, não é uma exclusividade de Javascript. Dê uma olhada nesse pedaço de código em Go:

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

O mesmo comportamento "inesperado"! E é o caso de muitas outras linguagens de programação, faça o teste com a sua favorita.

Já conseguiu entender o que está acontencendo aqui? Você pode ter identificado o problema, mas caso não, tente pensar um pouquinho antes de prosseguir se gosta de resolver esse tipo de coisa.

## Um 100 inesperado?

É realmente inesperado? Não é, mas as vezes nos prega uma peça!

Se ainda não entendeu o que está acontecendo aqui, deixe-me mostrar. O for loop usa a variável `i` que incrementa 1 até chegar em 10. O bloco de código do loop está usando o valor da variável para incrementar a variável `sum`, entretanto, está sendo feito de maneira asíncrona, transformando isso numa receita para o desastre. O bloco de código tem um sleep, e o loop é muito mais rápido, e no momento que a variável `sum` é incrementada a variável `i` foi alterada e agora guarda o último valor: `10`. Esse valor é então somado 10 vezes.

## Cuidado com a mutabilidade

Isso nunca é um problema quando se tem código síncrono, mas a partir do momento que introduzimos paralelismo, isso começa a ter comportamentos inesperados. Ainda pior se tem a ver com concorrência, porque é quando race conditions voltam para nos assombrar.

## Uma correção fácil

Não tenha medo! É bem fácil contornar esse tipo de problema:

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

Uma simples variável local é suficiente para evitar o problema de compartilhar uma variável mutável, desde que agora cada block terá uma cópia do valor que não está sendo alterada.

## Concluindo

Meu exemplo anterior é um caso bobo. Quem quer somar o contador do loop, certo? Mas não é incomum ver código escrito da seguinte maneira:

```go
for i := 0; i < 100; i++ {
	go func() {
		sendEmail(users[i])
	}
}
```

Você pode mudar o `sendEmail` por qualquer outra chamada de função fazendo I/O que você queira executar em paralelo para deixar mais eficiente, e este não é o código em Go mais idiomático, mas traduz bem para outra linguagens de programação, o que torna ele perfeito para ilustrar o problema.
