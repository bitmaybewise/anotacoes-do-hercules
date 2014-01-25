---
layout: post
title:  "Implementando herança com Javascript"
date:   2014-01-25 19:57
tags: javascript
---

Javascrit é uma linguagem orientada a objetos, e por ser baseada em protótipos tem suas particularidades. Implementar herança em Javascript não é tão trivial quanto em outras linguagens, mas não é nenhum bicho de 7 cabeças. Vamos ver um exemplo:

{% highlight javascript %}
function Animal() {
  this.respirar = function() {
    // método que será herdado para todos os animais
  }
}

function Cachorro() {
  this.latir = function() {
    // latindo
  }
}

Cachorro.prototype = new Animal();
Cachorro.prototype.constructor = Cachorro;

var cachorro = new Cachorro();

console.log(cachorro instanceof Cachorro);
console.log(cachorro instanceof Animal);
console.log(Cachorro.prototype.constructor);
{% endhighlight %}

Basta definir a propriedade "prototype" da classe filha com uma instância da classe pai. Devemos também corrigir a referência da propriedade "constructor", já que a mesma estará referenciando a classe Animal.

A ordem da declaração importa, portanto, a função construtora deve vir antes das alterações no protótipo da classe.

Ao mudar a classe Animal para adicionar a propriedade "nome" devemos alterar também a classe filha para aproveitar o construtor da classe pai. Podemos fazer isso da seguinte forma:

{% highlight javascript %}
function Animal(nome) {
  this.nome = nome;

  this.respirar = function() {
    // método que será herdado para todos os animais
  }
}

function Cachorro(nome) {
  Animal.call(this, nome);

  this.latir = function() {
    // latindo
  }
}

Cachorro.prototype = new Animal();
Cachorro.prototype.constructor = Cachorro;

var cachorro = new Cachorro("Rex");

console.log(cachorro instanceof Cachorro);
console.log(cachorro instanceof Animal);
console.log(Cachorro.prototype.constructor);
console.log(cachorro.nome);
{% endhighlight %}

Alguns frameworks já implementam funções para aplicar herança. Se você utiliza algum, talvez seja interessante usar o que tem pronto.

####Links

[Javascript Definitive Guide: Chapter 9](http://books.google.com.br/books?id=2weL0iAfrEMC&lpg=PP1&dq=javascript%20definitive%20guide&hl=pt-BR&pg=PT174#v=onepage&q&f=true)

[MDN Introduction to Object-Oriented JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript)

[Backbone.js extend](http://documentcloud.github.io/backbone/#Model-extend)
