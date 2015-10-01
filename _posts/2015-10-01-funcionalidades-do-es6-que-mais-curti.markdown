---
layout: post
title:  "Funcionalidades do ES6 que mais curti"
date:   2015-10-01 01:01
tags:   javascript es6
---

O ecmascript 6 veio com um bocado de novidades, e projetos como o [babeljs](https://babeljs.io/) tornam nossa vida mais fácil, nos possibilitando já utilizar essas novas funcionalidades em browsers que somente suportam o ecmascript 5, ou apenas parcialmente o ecmascript 6.

Aqui vou listar algumas dessas novas funcionalidades que mais curti e utilizo com mais frequência.

### Arrow functions

ES5:

```javascript
numbers.map(function (v) { return v + 1; });

numbers.forEach(function (v) { 
  if (v % 5 === 0) {
    console.log(v);
  } 
});
```

ES6:

```javascript
numbers.map(v => v + 1);

numbers.forEach(v => { 
  if (v % 5 === 0) {
    console.log(v);
  }
});
```

### Default parameter values

ES5:

```javascript
function f(x, y) {
  if (y === undefined) {
    y = 1;
  }
  return x + y;
}
```

ES6:

```javascript
function f(x, y = 1) {
  return x + y;
}
```

### String interpolation

ES5:

```javascript
var customer = { name: 'Foo' };
var message = "Hello " + customer.name + ". How are you?";
```

ES6:

```javascript
var customer = { name: 'Foo' };
var message = `Hello ${customer.name}. How are you?`
```
### Method properties

ES5:

```javascript
obj = {
  foo: function() {
    // do something
  }
}
```

ES6:

```javascript
obj = {
  function foo() {
    // do something
  }
}
```

### Array matching

ES5:

```javascript
var list = [1, 2, 3];
var a = list[0], b = list[1], c = list[2];
```

ES6:

```javascript
var list = [1, 2, 3];
var [a, b, c] = list;
```

### Object matching

ES5:

```javascript
var obj = { firstName: 'Hercules', lastName: 'Merscher' };
var firstName = obj.firstName;
var lastName = obj.lastName;
```

ES6:

```javascript
var { firstName, lastName } = { firstName: 'Hercules', lastName: 'Merscher' };
```

### Modules

ES5:

```javascript
// math.js
Math = {};
Math.pi = 3.14;
Math.sum = function(x, y) {
  return x + y;
};

// app.js
var mySum = Math.sum(1, 2) + Math.pi;
```

ES6:

```javascript
// math.js
export {
  pi: 3.14,

  function sum(x, y) {
    return x + y;
  }
};

// app.js
import * as Math from "math";
var mySum = Math.sum(1, 2) + Math.pi;

// other-app.js
import { sum, pi } from "math";
var mySum = sum(1, 2) + pi;
```

### E o restante?

Tem muito mais coisa, e você pode conferir no site [es6-features.org](http://es6-features.org) a descrição de cada nova funcionalidade, inclusive as já citadas aqui neste post. 

Você pode experimentar o es6 no próprio browser através do site [es6fiddle.net](http://www.es6fiddle.net/).
