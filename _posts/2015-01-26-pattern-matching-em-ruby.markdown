---
layout: post
title:  "Pattern matching em Ruby"
date:   2015-01-26 21:32
tags: ruby "programação funcional"
---

Ruby é uma linguagem com influências de vários paradigmas de programação, dentre eles o funcional. Há 2 características de linguagens funcionais que quando se aprende sente falta em outras linguagens, que são: high order functions e pattern matching. Em Ruby temos high order functions através de blocos, mas infelizmente pattern matching não está presente. Não da forma como Haskell, F#, OCaml e tantas outras linguagens funcionais extensivamente usam.

Ao trabalhar com blocos em Ruby podemos usar alguns padrões para distinguir os parâmetros passados. Escrevemos um bloco com 2 parâmetros assim:

{% highlight ruby %}
block = -> (one, two) { p one, two }
block.call(1, 2)
# 1
# 2
{% endhighlight %}

Aqui não tem mistério. Um bloco que recebe o primeiro e segundo parâmetro e faz alguma coisa. Nesse exemplo apenas imprime os valores na saída padrão.

Vamos ver algo um pouco mais interessante. E se quisessemos que o bloco recebesse um número indefinido de parâmetros? Podemos usar o recurso de splat parameters:

{% highlight ruby %}
block = -> (*args) { p args }
block.call(3, 4)
# [3, 4]
{% endhighlight %}

Legal, né? Ele junta todos os parâmetros em um array, o qual podemos manipular. Dá para ficar melhor! Podemos pegar apenas o primeiro parâmetro e deixar o resto em um array, um padrão bem comum em linguagens como Haskell por exemplo.

{% highlight ruby %}
block = -> (head, *tail) { p head, tail }
block.call(5, 6, 7, 8)
# 5
# [6, 7, 8]
{% endhighlight %}

Se o primeiro ou último parâmetro não importa, podemos ignorá-lo.

{% highlight ruby %}
block = -> (_, *tail) { p tail }
block.call(5, 6, 7, 8)
# [6, 7, 8]
block = -> (*init, _) { p init }
block.call(5, 6, 7, 8)
# [5, 6, 7]
{% endhighlight %}

Também podemos pegar o primeiro e último parâmetro, e deixar os intermediários em um array.

{% highlight ruby %}
block = -> (first, *middle, last) { p first, middle, last }
block.call(5, 6, 7, 8)
# 5
# [6, 7]
# 8
block.call(5, 8)
# 5
# []
# 8
{% endhighlight %}

Com atribuições também conseguimos fazer coisas interessantes.

{% highlight ruby %}
_, *tail = [1, 2, 3, 4]
p tail
# [2, 3, 4]
head, _  = [1, 2, 3, 4]
p head
# 1
*init, _ = [1, 2, 3, 4]
p init
# [1, 2, 3]
{% endhighlight %}

Em linguagens funcionais geralmente usamos tuplas em determinados momentos. Ruby não tem um objeto tupla, mas podemos usar um array de 2 posições para simular uma, e ao iterar numa coleção de tuplas (array de array) temos algumas facilidades para obter esses valores.

{% highlight ruby %}
[
  ["First Name", "Hercules"], 
  ["Last Name",  "Merscher"] 
].each do |(key, value)|
  puts "#{key}: #{value}"
end
# First Name: Hercules
# Last Name: Merscher
{% endhighlight %}

Hashes também não podiam ficar de fora.

{% highlight ruby %}
{ first_name: "Hercules", last_name: "Merscher" }.each do |(key, value)|
  puts "#{key}: #{value}"
end
# first_name: Hercules
# last_name: Merscher
{% endhighlight %}

Com esses truques dá para diminuir um pouquinho mais nosso código, e fica mais fácil de ler e entender.
