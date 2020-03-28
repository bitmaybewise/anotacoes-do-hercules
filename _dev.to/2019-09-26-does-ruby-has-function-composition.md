# Does Ruby has function composition

## Introduction

What's function composition? Why it matters?

In functional programming languages, such as Haskell, we are able to define functions and compose them to create new functions, combining its behaviours. For example:

```haskell
fizzBuzz n = mod n 3 == 0 || mod n 5 == 0

fizzBuzzSum = sum . filter fizzBuzz

main = putStrLn $ show (fizzBuzzSum [1..999])
-- 233168
```

When we want to combine 2 or more functions, we can use the `.` operator in Haskell to combine functions. What happens is the value will be chained through one function to the other(s), resulting into a value after every function is applied.

This possibility give us a degree of flexibility, as we are able to define new functions re-using previous defined functions to create a new one. Thumbs up for productivity!

## What about Ruby?

Ruby is multi-paradigm language. It's true that it includes some functional features, but it doesn't have high order functions. Well, at least not as we are used to in Haskell or Javascript.

Ruby has `lambdas` and `Proc` objects. They are interchangeable in many cases:

```ruby
numbers = (1..999).to_a

fizz_buzz = -> (n) { n % 3 == 0 || n % 5 == 0 }

filter = -> (fn, array) { array.select(&fn) }

sum = proc { |array| array.reduce(:+) }

puts sum.call(filter.call(fizz_buzz, numbers))
# 233168
```

If you pay attention, `fizz_buzz` is declared as a `lambda`, while `sum` is declared as a `Proc` object. Under the hood they are both represented as a `Proc`. So far so good.

What if you want to compose them? If you're using Ruby 2.6+ it is pretty easy:

```ruby
fizz_buzz_sum = sum << filter.curry[fizz_buzz]

# composing the other way around
fizz_buzz_sum = filter.curry[fizz_buzz] >> sum

puts fizz_buzz_sum.call(numbers)
# 233168
```

Not bad at all! Thanks Ruby core team for the `>>` and `<<` operators for `Proc`. :)

But Ruby is an object oriented programming language at its core. Should we ditch classes and objects in favour of using lambdas everywhere?

## Object oriented... Object oriented everywhere!

In object oriented languages, classes, objects and methods are used to represent behaviours instead of functions. This is the way we use Ruby on a daily basis, cause in Ruby everything is an object, remember?

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

It achieves the same but, how to compose objects with lambdas in a seamless way?

The `to_proc` is a protocol for converting an object to a `Proc` object:

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

Isn't it cool?!

```ruby
puts (filter.curry[FizzBuzz.new] >> sum).call(numbers)
# 233168
```

This way we can even mix objects and lambdas.

## An alternative way to compose

Well, on Ruby 2.6+ we have the `>>` and `<<` operators to compose `lambdas`. But what about previous versions of Ruby?

The beauty of functional programming:

```ruby
sum_fizz_buzz = -> (value) do
  [filter.curry[FizzBuzz.new], sum].reduce(value) do |previous_result, object|
    object.to_proc.call(previous_result)
  end
end

puts sum_fizz_buzz.call(numbers)
# 233168
```

Almost everything can be solved just with... functions. :)

## References

- http://learnyouahaskell.com/higher-order-functions
- https://ruby-doc.org/core-2.6/Proc.html#method-i-to_proc