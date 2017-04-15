---
layout: post
title: "Haskell do notation"
date: 2015-05-27 17:46:00
tags: haskell monad 
---

No [post anterior](/2015/05/18/o-que-e-uma-monad.html) mostrei como implementar uma monad em Haskell e como utilizar as funções __>>=__ e __return__ para encadear monads. Mas Haskell tem um sintax sugar chamado __do notation__ para lidar com monads, tornando nosso código bem mais simples de ler e entender.

{% highlight haskell %}
ghci> Just 1 >>= (\x -> Just (2 + x))
Just 3
{% endhighlight %}

No exemplo acima temos um exemplo de encadeamento de valores do tipo Maybe. Este é um código bem pequeno, agora, imagine um código apenas um pouco maior:

{% highlight haskell %}
ghci> Just 1 >>= (\x -> Just (2 + x) >>= (\y -> Just (y * 3)))
Just 9
{% endhighlight %}

Pronto! Bastou adicionar apenas mais uma aplicação de valor e o exemplo ficou bem feio e complicado.

Podemos tentar criar um função para contornar esse problema:

{% highlight haskell %}
calc :: Maybe Int
calc = Just 1       >>= (\x ->
       Just (2 + x) >>= (\y ->
       Just (y * 3)))

ghci> calc
Just 9
{% endhighlight %}

Não parece que melhorou muita coisa, não acha? Fazendo assim acabamos usando extensivamente lambdas. Com __do notation__ o mesmo código fica da seguinte maneira:

{% highlight haskell %}
calc :: Maybe Int
calc = do
     x <- Just 1
     y <- Just (2 + x)
     Just (y * 3)

ghci> calc
Just 9
{% endhighlight %}

No exemplo acima os valores foram extraídos da monad para __x__ e __y__, assim conseguimos usar o valor nas computações posteriores. Como __do notation__ é apenas um sintax sugar, não precisamos de nos preocupar com os casos de falha. Vamos ver um exemplo introduzinho um caso de falha:


{% highlight haskell %}
calc2 :: Maybe Int
calc2 = do
     x <- Just 1
     y <- Nothing
     z <- Just (x + z)
     Just (z * 3)

ghci> calc2
Nothing
{% endhighlight %}

Como o exemplo mostra, se introduzirmos algum valor de falha a função __fail__ será executada. Essa função faz parte da type class Monad, mas tem uma implementação padrão:

{% highlight haskell %}
fail :: (Monad m) => String -> m a  
fail msg = error msg
{% endhighlight %}

Para o tipo __Maybe__ a implementação é a seguinte:

{% highlight haskell %}
fail _ = Nothing
{% endhighlight %}

Ao utilizar __do notation__ podemos utilizar pattern matching também:

{% highlight haskell %}
primeiraLetra :: Maybe Char
primeiraLetra = do
              (x:xs) <- Just "Hercules"
              return x

ghci> primeiraLetra
Just "H"
{% endhighlight %}

Se o pattern matching falhar, a função __fail__ será executada:

{% highlight haskell %}
ops :: Maybe Char
ops = do
    (x:xs) <- Just ""
    return x

ghci> ops
Nothing
{% endhighlight %}

Se você conhece Scala já deve ter utilizado __for comprehensions__. Em Scala __for comprehensions__ cumprem o mesmo papel de __do notation__ em Haskell para monads:

{% highlight scala %}
scala> val computation1 = for {
     |   x <- Some(1)
     |   y <- None
     |   z <- Some(x + y)
     | } yield z
computation1: Option[Int] = None

scala> val computation2 = for {
     |   x <- Some(1)
     |   y <- Some(x + 2)
     | } yield y
computation2: Option[Int] = Some(3)
{% endhighlight %}


#### Links

[Haskell do notation](http://learnyouahaskell.com/a-fistful-of-monads#do-notation)

[Scala for expressions](http://www.artima.com/pins1ed/for-expressions-revisited.html)
