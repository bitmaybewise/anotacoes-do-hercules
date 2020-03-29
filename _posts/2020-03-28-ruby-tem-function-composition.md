---
layout: post
title:  "Ruby tem function composition?"
date:   2020-03-28
tags: ruby, fp, functional, funcional
---

## Introdução

O que é function composition? Ou em bom português, composição de função. Mas vou me ater aos termos técnicos aqui em inglês, pois prefiro evitar traduções técnicas.

Em linguagens de programação funcionais, como Haskell, nós podemos definir funções e compor elas para criar novas funções, combinando seus comportamentos. Por exemplo:

```haskell
fizzBuzz n = mod n 3 == 0 || mod n 5 == 0

fizzBuzzSum = sum . filter fizzBuzz

main = putStrLn $ show (fizzBuzzSum [1..999])
-- 233168
```

Quando queremos combinar 2 ou mais funções, nós podemos usar o operador `.` em Haskell para combinar funções. O que acontece é que o valor vai ser encadeado e passado de uma função para a(s) outra(s), resultando em um valor depois de cada função ser aplicada.

Essa possibilidade nos dá um certo grau de flexibilidade, já que é possível definir novas funções re-utilizando funções já existentes para criar uma nova. Joinha para produtividade!

## E o Ruby?

Ruby é uma linguagem multi-paradigma. É verdade que ela inclui algumas funcionalidades do paradigma funcional, mas não tem high order functions. Bem, pelo menos não como nós estamos acostumados a ver em Haskell e Javascript.

Ruby tem `lambda` e `Proc` objects. Ambos são intercambiáveis em muitos casos:

```ruby
numbers = (1..999).to_a

fizz_buzz = -> (n) { n % 3 == 0 || n % 5 == 0 }

filter = -> (fn, array) { array.select(&fn) }

sum = proc { |array| array.reduce(:+) }

puts sum.call(filter.call(fizz_buzz, numbers))
# 233168
```

Se prestar atenção, `fizz_buzz` é declarado como um `lambda`, enquanto `sum` é declarado como um `Proc` object. Por baixo dos panos ambos são representados como um `Proc`. Até aqui tudo bem.

E se quisermos compor isso? Se estiver utilizando Ruby 2.6+ é bem fácil:

```ruby
fizz_buzz_sum = sum << filter.curry[fizz_buzz]

# composing the other way around
fizz_buzz_sum = filter.curry[fizz_buzz] >> sum

puts fizz_buzz_sum.call(numbers)
# 233168
```

Nada mal! Obrigado ao Ruby core team pelos operadores `>>` e `<<` para `Proc`. :)

Mas Ruby é uma linguagem de programa orientada a objetos em sua essência. Devemos parar de usar objetos em favor de lambdas por todo lado?

## Orientação a objetos... orientação a objetos em todo lugar!

Em linguagens orientadas a objetos, objetos e métodos são utilizados para representar comportamentos ao invés de funções. Esse é o jeito que nós utilizamos Ruby no dia a dia, porque em Ruby tudo é um objeto, lembra?

```ruby
class FizzBuzz
  def call(n)
    n % 3 == 0 || n % 5 == 0
  end
end

puts FizzBuzz.new.call(1)
# false
puts FizzBuzz.new.call(15)
# true
puts FizzBuzz.new.call(30)
# true
```

Dá para fazer o mesmo, mas como compor objetos com lambdas de uma maneira harmônica?

O `to_proc` é um protocolo para converter um objeto para um objeto `Proc`:

```ruby
class FizzBuzz
  def to_proc
    -> (n) { n % 3 == 0 || n % 5 == 0 }
  end
end

puts FizzBuzz.new.to_proc.call(3)
# true
puts FizzBuzz.new.call(3)
# true
```

Não é legal?!

```ruby
puts (filter.curry[FizzBuzz.new] >> sum).call(numbers)
# 233168
```

Desse jeito nós podemos misturar objetos e lambdas.

## Um jeito alternativo de composição

Bem, no Ruby 2.6+ nós temos os operadores `>>` e `<<` para compor `lambdas`. Mas o que dizer das versões anteriores?

A beleza da programação funcional:

```ruby
sum_fizz_buzz = -> (value) do
  [filter.curry[FizzBuzz.new], sum].reduce(value) do |previous_result, object|
    object.to_proc.call(previous_result)
  end
end

puts sum_fizz_buzz.call(numbers)
# 233168
```

Quase tudo pode ser resolvido com apenas... funções. :)

## Referências

- [http://learnyouahaskell.com/higher-order-functions](http://learnyouahaskell.com/higher-order-functions)
- [https://ruby-doc.org/core-2.6/Proc.html#method-i-to_proc](https://ruby-doc.org/core-2.6/Proc.html#method-i-to_proc)