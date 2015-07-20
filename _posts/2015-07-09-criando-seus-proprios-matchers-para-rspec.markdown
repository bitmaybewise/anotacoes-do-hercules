---
layout:  post
title:   "Criando seus próprios matchers para RSpec"
date:    2015-07-09 00:19:00
tags:    ruby rspec
---

Escrevendo código para nossos programas costumamos usar várias técnicas para evitar repetições. Nos testes automatizados não é diferente, é código e precisa ser mantido também, precisa ser algo fácil de entender.

Digamos que temos um método que devolve uma resposta http que vamos retornar como uma resposta do [rack](https://github.com/rack/rack).

```ruby
def responds_ok(message)
  [200, { 'Content-Type' => 'text/html' }, [message]]
end

RSpec.describe '#responds_ok' do
  it 'returns status ok' do
    response = responds_ok('my message')
    expect(response[0]).to eq 200
  end

  it 'returns my message' do
    msg = 'my message'
    response = responds_ok(msg)
    expect(response[2]).to eq [msg]
  end
end
```

Essas specs são bem simples, mas força a pessoa que vai lê-las a entender que o retorno é um array, que o primeiro valor é o status e o terceiro valor é a mensagem, e nesse último caso, que a mensagem seja um outro array. Para quem escreveu esse código inicialmente pode parecer algo óbvio, mas temos uma maneira melhor de fazer essas verificações. Uma boa alternativa nesse caso é criar nossos próprios matchers.

```ruby
require 'rspec/expectations'

RSpec::Matchers.define :be_ok do
  match do |response|
    response[0] == 200
  end
end

RSpec::Matchers.define :have_message do |message|
  match do |response|
    response[2].join == message
  end
end
```

Matchers podem simplesmente verificar um valor, ou comparar diferentes valores passados como parâmetro. No código acima podemos ver que é bem simples definir um novo matcher com RSpec, basta passar um bloco para o método __match__ que retorne um valor booleano.

Desta maneira, as specs podem ser escritas da seguinte maneira:

```ruby
RSpec.describe '#responds_ok' do
  it 'returns status ok' do
    response = responds_ok('my message')
    expect(response).to be_ok
  end

  it 'returns my message' do
    msg = 'my message'
    response = responds_ok(msg)
    expect(response).to have_message(msg)
  end
end
```

Bem mais agradável aos olhos, não é mesmo?!

#### Links

[RSpec custom matchers](http://www.relishapp.com/rspec/rspec-expectations/v/3-3/docs/custom-matchers)
