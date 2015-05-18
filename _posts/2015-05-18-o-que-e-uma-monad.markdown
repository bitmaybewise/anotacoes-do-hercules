---
layout: post
title: "Entendendo o que é monad implementando uma monad"
date: 2015-05-18 12:35:00
tags: haskell monad
---

Antes de começar a falar sobre monads, um aviso. Tentarei explicar de forma mais abstrata, porém, como irei usar Haskell nas implementações dos exemplos alguns detalhes serão específicos desta linguagem. Ficarei feliz em ajudar a implementar estes exemplos abaixo em outras linguagens caso haja interesse, mas irei me ater usando Haskell neste post.

### O que é uma monad?

Monad é uma estrutura que representa computações como sequência de passos. Hmm... muito abstrato, não é?

Simplificando um pouco, monad é um valor com contexto. Bom, mas o que seria esse contexto? 

Vamos criar um tipo chamado __Talvez__ como exemplo, com a seguinte implementação:

```haskell
data Talvez a = Nada | Apenas a deriving (Show)
```

Como podem ver, o tipo __Talvez__ tem dois construtores de tipo, o __Nada__ e o __Apenas__. O tipo __a__ no construtor quer dizer que qualquer tipo de valor é aceito ao criar um valor do tipo __Talvez__. Vamos ao GHCI (REPL do Haskell) verificar como podemos usar esse tipo:

```haskell
ghci> Nada
Nada
ghci> Apenas 1
Apenas 1
ghci> Apenas "uma string"
Apenas "uma string"
```

Repare no tipo de __Nada__ e __Apenas__ inferidos no REPL:

```haskell
ghci> :type Nada
Nada :: Talvez a
ghci> :type Apenas 1
Apenas 1 :: Num a => Talvez a
ghci> :type Apenas "uma string"
Apenas "uma string" :: Talvez [Char]
```

O tipo __Talvez a__ representa uma valor do tipo __a__ com um possível contexto de falha ou sucesso. O valor __Apenas 1__ indica que há um número, já __Nada__ indica uma ausência de valor. Se você considerar esses valores como resultados de computações, o __Nada__ indica que a computação falhou, enquanto que o __Apenas 1__ foi uma computação bem sucedida.

Ok! Mas apenas isso não torna o tipo Talvez uma monad. Para isso, temos de tornar nosso tipo uma instância de Monad. Há também algumas leis a serem respeitadas, mas vamos ignorar isso por enquanto.

Temos de fazer com que Talvez implemente a type class Monad, que exige que implementemos as funções __return__ e __>>=__(pronunciada como bind).

### Implementando a type class Monad

```haskell
import Control.Monad

data Talvez a = Nada | Apenas a deriving (Show)

instance Monad Talvez where
  return :: a -> Talvez a
  (>>=) :: Talvez a -> (a -> Talvez b) -> Talvez b
```

Vamos verificar as assinatura de tipos das funções, para entender o que cada função deve fazer.  

Para a função __return__, dado um valor do tipo __a__(pode ser qualquer tipo, como Int, String, Bool, etc), este valor deve ser inserido em um contexto mínimo(no nosso caso o __Apenas__, já que o __Nada__ significa ausência de valor). Só lembrando que, a função __return__ aqui nada tem a ver com __return__ usado em outras linguagens de programação.

A implementação ficará assim:

```haskell
return :: a -> Talvez a
return a = Apenas a
```

A assinatura da função __>>=__ diz que, dado um valor do tipo __Talvez__ como primeiro parâmetro, e uma função(que recebe um valor __a__ e retorna um valor do tipo __Talvez a__) como segundo parâmetro, retorna um tipo __Tavez b__ como resultado. 

A implementação:

```haskell
(>>=) :: Talvez a -> (a -> Talvez b) -> Talvez b
Nada >>= f = Nada
(Apenas a) >>= f = f a
```

Se você não está acostumado com código em Haskell, não se assuste. Para implementar a função __>>=__ foi utilizado aqui a notação infixa e pattern matching. O valor a esquerda de __>>=__ é o valor do primeiro parâmetro, a direita é a função passada como segundo parâmetro.

A função __>>=__ funciona então da seguinte maneira: quando o primeiro parâmetro for __Nada__, retorne __Nada__ sem aplicar a função, quando for __Apenas a__, aplique a função ao valor __a__. Lembrando que a função a ser aplicada deve receber um valor qualquer e retornar um __Talvez b__.

Vamos criar algumas funções de exemplo e experimentar as implementações:

```haskell
talvezSoma1 :: Int -> Talvez Int
talvezSoma1 numero = Apenas (numero + 1)

somaNada :: Int -> Talvez Int
somaNada _ = Nada

ghci> Apenas 1 >>= talvezSoma1
Apenas 2
ghci> Apenas 5 >>= talvezSoma1
Apenas 6
ghci> Apenas 1 >>= somaNada
Nada
ghci> Nada >>= talvezSoma1
Nada
ghci> Apenas 1 >>= talvezSoma1 >>= talvezSoma1
Apenas 3
ghci> Nada >>= talvezSoma1 >>= talvezSoma1
Nada
ghci> Apenas 1 >>= talvezSoma1 >>= somaNada >>= talvezSoma1
Nada
```

Podemos encadear a chamada de várias funções desta maneira. Bacana não é?  

Bom, ainda não acabamos. Só porque tornamos o nosso tipo uma instância de Monad ainda não o torna uma. Para isso precisamos obedecer algumas leis.

### As leis a serem seguidas

Vamos ver cada uma e conferir se __Talvez a__ está obedecendo a cada uma:

- A primeira lei define que, se pegarmos um valor, colocarmos em um contexto mínimo usando a função __return__ e então passar para função __>>=__, o resultado será o mesmo que pegar o valor e aplicar a função.

```haskell
ghci> talvezSoma1 1
Apenas 2
ghci> return 1 >>= talvezSoma1
Apenas 2
```

- A segunda lei define que, se temos um valor que é uma monad, e nos usarmos a função __>>=__ para passar o valor para a função __return__, o resultado deve ser o nosso valor original.

```haskell
ghci> Apenas 1 >>= return
Apenas 1
```

- A terceira e última lei diz que, dado um encadeamento de chamadas de função, a ordem que as mesmas são aninhadas não deve influenciar no resultado.

```haskell
ghci> Apenas 1 >>= (\n -> Apenas (n + 1) >>= talvezSoma1)
Apenas 4
ghci> (Apenas 1 >>= \n -> Apenas (n + 1)) >>= talvezSoma1
Apenas 4
ghci> Apenas 1 >>= (somaNada >>= talvezSoma1)
Nada
ghci> (Apenas 1 >>= somaNada) >>= talvezSoma1
Nada
```

Como pudemos ver nos exemplos, nossa implementação obedece a todas as leis. Devemos lembrar de seguir essas leis ao implementar uma monad, pois o compilador não irá nos alertar a respeito disso.

Acabamos de reimplementar a monad __Maybe a__ que existe na biblioteca padrão do Haskell. Não em sua totalidade é verdade, mas o suficiente para entender como implementar uma monad. Vá em frente, substitua nos códigos de exemplo o __Talvez__ por __Maybe__, __Nada__ por __Nothing__, __Apenas__ por __Just__ e verá que o comportamento é o mesmo. :-)

### Recapitulando

Uma monad é um tipo de computação que carrega consigo um contexto, implementa type class Monad, e segue as 3 leis estabelecidas para monads.

A biblioteca padrão do Haskell tem outras monads, e como pudemos ver nesses exemplos, monads não necessariamente precisam causar efeitos colaterais, mas a forma que Haskell usa para causar efeitos colaterais é através de monads. Há também um sintax sugar para lidar com monads, mas esses tópicos ficarão para um próximo post.

Deixo aqui os agradecimentos a [@claytonsilva](https://github.com/claytonsilva) e [@jugoncalves](https://github.com/jugoncalves) pela revisão do texto.

#### Links

[Monad (Wikipedia)](http://en.wikipedia.org/wiki/Monad_%28functional_programming%29)

[Monad laws (Learn you a Haskell)](http://learnyouahaskell.com/a-fistful-of-monads#monad-laws)
