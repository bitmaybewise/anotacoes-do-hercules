---
layout:  post
title:   "Coleções paralelas do Scala"
date:    2015-07-20 20:16
tags:    scala
---

Quando estamos usando programação funcional uma tarefa recorrente é operar sobre coleções. Seja para transformar, filtrar ou simplesmente executar alguma operação com os valores.

Atualmente é muito comum computadores terem mais de um processador, o que nos permite tirar proveito disso e executar nosso código em paralelo, mas geralmente isso não é algo trivial. E aqui entram as coleções paralelas do Scala, uma abstração que nos permite facilmente paralelizar nossas operações sobre listas.

Veja este exemplo, onde uma operação é realizada de forma sequencial:

{% highlight scala %}
val list = (1 to 5000).toList
list.map(_ + 1)
{% endhighlight %}

Para realizar a mesma operação em paralelo, basta invocarmos o método __par__ em nossa lista. Assim podemos usar a coleção paralela da mesma maneira que usariamos de maneira sequencial:

{% highlight scala %}
list.par.map(_ + 1)
{% endhighlight %}

As coleções paralelas são integradas com a bibliotecas de coleções do Scala, o que nós dá algumas estruturas de dados prontas para uso:

- ParArray
- ParVector
- mutable.ParHashMap
- mutable.ParHashSet
- immutable.ParHashMap
- immutable.ParHashSet
- ParRange
- ParTrieMap

Mais alguns exemplos:

{% highlight scala %}
// somando via fold
val numbers = (1 to 5000).toArray.par
numbers.fold(0)(_ + _)

// filtrando nomes
val names = List("Hercules, João, Maria, José, Fulano, Cicrano, Beltrano").par
names.filter(_.length >= 6)

// uma outra maneira de criar uma coleção paralela
import scala.collection.parallel.mutable.ParArray
val numbers = ParArray(1,2,3,4,5)
{% endhighlight %}

Uma coleção paralela, mesmo sendo processada em diferentes ordens, irá reorganizar os elementos na ordem original. Veja:

{% highlight scala %}
val list = (1 to 10).toList.par
list: scala.collection.parallel.immutable.ParSeq[Int] = ParVector(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)

list.map(_ + 10)
res1: scala.collection.parallel.immutable.ParSeq[Int] = ParVector(11, 12, 13, 14, 15, 16, 17, 18, 19, 20)

list.map(_ + 10)
res2: scala.collection.parallel.immutable.ParSeq[Int] = ParVector(11, 12, 13, 14, 15, 16, 17, 18, 19, 20)
{% endhighlight %}

### Cuidado com operações mutáveis!

{% highlight scala %}
var sum = 0

val list = (1 to 5000).toList.par

list.foreach(sum += _); sum
res1: Int = 11515554

sum = 0

list.foreach(sum += _); sum
res2: Int = 12498410
{% endhighlight %}

Como pode ver nos exemplos acima, cada vez que a variável __sum__ é reiniciada para 0, e usamos __foreach__ para realizar a soma, o resultado é diferente. Isso acontece por conta de várias threads alterando o valor da mesma variável ao mesmo tempo, algo que não teriamos com uma operação sequencial.

#### Links

[Scala parallel collections](http://docs.scala-lang.org/overviews/parallel-collections/overview.html)
