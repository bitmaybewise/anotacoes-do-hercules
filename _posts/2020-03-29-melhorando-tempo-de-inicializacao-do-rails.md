---
layout: post
title:  "Melhorando tempo de inicialização do Rails"
date:   2020-03-29
tags: ruby, rails
---

Post publicado originalmente em [https://eng.fromatob.com/post/2019/11/speeding-up-rails-boot-time/](https://eng.fromatob.com/post/2019/11/speeding-up-rails-boot-time/)

## Introdução

Geralmente quando temos uma pequena aplicação Rails, ou iniciamos um novo projeto, nós não temos o problema de um tempo de inicialização lento. Nesse ponto nosso app está usando só algumas poucas bibliotecas, a lógica não evoluiu em um monstro, sem muitos testes de integração/aceitação... moleza!!!

Mas então chega o dia que você teme fazer qualquer mudança na sua base de código. Uma única pequena mudança significa uma infinidade de tempo para sua web app iniciar ou para rodar um único teste unitário. Eu sei, são só alguns segundos, mas parece uma eternidade quando você precisa do bom e velho feedback dos testes unitários. Feedbacks lentos durante este processo pode acabar frustrando os membros do time que tentam fazer o seu trabalho.

Na fromAtoB nós tivemos um problema como esse:

```bash
$ time bin/rspec spec/models/country_spec.rb

Randomized with seed 46782
............................

Finished in 3.59 seconds (files took 1 minute 3.31 seconds to load)
28 examples, 0 failures

Randomized with seed 46782

real  1m 7.31s
user  0m 6.38s
sys   0m 10.01s
```

Não é uma experiência muito boa para ser honesto. Mas nós fizemos algumas pequenas mudanças para melhorar esse tempo drasticamente!

Nada especial ou desconhecido que a comunidade Rails não saiba. As soluções listadas aqui vem por padrão em versões novas do Rails. Mas se você ainda trabalha em um legado com uma versão antiga do Rails, vale a pena dar uma olhada se isso já foi feito.

## Bootsnap ao resgate

[Bootsnap](https://github.com/Shopify/bootsnap) é uma biblioteca desenvolvida pelo Shopify para otimizar e fazer cache de computações custosas.

Na plataforma do Shopify, que é um grande monolíto, foram capazes de [diminuir o tempo de inicialização em 75%](https://github.com/Shopify/bootsnap#performance). A nossa app também um monolíto ainda, e só adicionando o bootsnap conseguimos diminuir o tempo de inicialização pela metade:

```bash
$ time bin/rspec spec/models/country_spec.rb

Randomized with seed 8078
............................

Finished in 2.95 seconds (files took 29.18 seconds to load)
28 examples, 0 failures

Randomized with seed 8078

real  0m 32.47s
user  0m 3.10s
sys   0m 4.16s
```

Para fazer isso adicione a gem ao Gemfile:

```ruby
gem 'bootsnap', require: false
```

E configure no arquivo `config/boot.rb`:

```ruby
require 'bootsnap/setup'
```

Porém o bootsnap não limpa o seu próprio cache. Se quiser contornar isso e ainda utilizá-lo em algumas situações você vai precisar adicionar um toggle. Uma forma de fazer isso seria:

```ruby
require 'bootsnap/setup' unless ENV['DISABLE_BOOTSNAP'].present?
```

O bootsnap é configurável também. Se precisar saber mais sobre como mudar suas configurações de uma olhada em: https://github.com/Shopify/bootsnap#usage

Adicionando o bootsnap vai melhorar o tempo de inicialização em todos os ambientes.

Bootsnap vem por padrão no Rails 5.2+.

Mas nós ainda podemos melhorar o ambiente development...

## Spring

> Spring é um preloader que vai carregar o Rails em memória. Ele agiliza o ambiente de desenvolvimento mantendo a aplicação carregada em segundo plano, assim não precisa de inicializá-la para rodar testes, rake task ou migrações.

Adicione ao Gemfile:

```ruby
gem "spring", group: :development
```

E gere os executáveis que incluem o spring no diretório `bin/`:

```bash
$ bundle install
$ bundle exec spring binstub --all
```

Se você utiliza Rspec, adicione também esta gem ao Gemfile:

```ruby
gem 'spring-commands-rspec', group: :development
```

E gere os binstubs:

```bash
$ bundle exec spring binstub rspec
```

Na primeira execução não vai ver muita diferença no tempo, já que a app ainda não foi pre-carregada:

```bash
$ time bin/rspec spec/models/country_spec.rb

Randomized with seed 48078
............................

Finished in 3.1 seconds (files took 28.95 seconds to load)
28 examples, 0 failures

Randomized with seed 48078

real  0m 32.39s
user  0m 3.31s
sys   0m 3.18s
```

Mas depois da primeira execução vai notar uma boa diferença:

```bash
$ time bin/rspec spec/models/country_spec.rb
Running via Spring preloader in process 24

Randomized with seed 21274
............................

Finished in 3.79 seconds (files took 3.34 seconds to load)
28 examples, 0 failures

Randomized with seed 21274

real  0m 10.47s
user  0m 0.14s
sys   0m 0.08s
```

Não é necessário fazer mais nada além de utilizar os binstubs gerados no diretório `bin`.

Spring vem por padrão desde o Rails 5+.

Para mais informações: https://github.com/rails/spring

## Não só para Rails

Essas mudanças não são específicas para Rails apenas. Aqui neste tutorial as configurações estão relacionadas ao Rails, mas se tem uma app em Ruby, dê uma olhada nos readmes de ambas as gems e verá que dá para usá-las sem muito trabalho, são bem diretas ao ponto para usar e configurar.

## Outras dicas

Adicione `require: false` para gems que não precisa carregar automaticamente. Exemplo:

```ruby
gem 'rubocop', require: false
```

Rubocop está no Gemfile só para dar apoio em tempo de desenvolvimento e CI, para acompanhar a qualidade do código escrito fazendo lint. Não precisamos desta gem sendo carregada na aplicação. Podemos economizar memória e tempo de inicialização prestando atenção a isso.

Seja cuidadoso(a) com as dependências. Bibliotecas e frameworks são bem úteis, e nós precisamos para sermos produtivos no trabalho do dia a dia, mas há casos onde apenas uma função ou algumas poucas linhas de código são necessários, e nesse caso é ok copiar e colar de algum lugar. Sempre que adicionamos mais dependências ficamos mais limitados em termos de atualização de dependências. De acordo com que o tempo passa, bibliotecas podem ter o desenvolvimento abandonado e acabarmos tendo que dedicar mais tempo para nos livrarmos dela mais tarde.
