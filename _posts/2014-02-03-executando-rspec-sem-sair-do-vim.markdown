---
layout: post
title:  "Executando RSpec sem sair do Vim"
date:   2014-02-03 21:51:00
tags: vim rspec ruby
---

Através do vim podemos executar qualquer comando que utilizamos no terminal. Então, para executar o rspec basta digitar este comando no modo normal:

{% highlight vim script %}
:!rspec
{% endhighlight %}

Isso já basta para rodar todas as specs. Entretanto, caso queira executar as specs de somente um arquivo, ou uma linha específica, você terá que digitar todo o comando manualmente.

Para resolver esse problema temos o plugin disponibilizado pela [thoughtbot](https://github.com/thoughtbot):

[vim-rspec](https://github.com/thoughtbot/vim-rspec)

Recomendo utilizar o [vundle](https://github.com/gmarik/vundle) para gerenciar seus plugins do vim. Assim basta adicionar este conteúdo ao .vimrc:

{% highlight vim script %}
Bundle 'thoughtbot/vim-rspec'

map <Leader>t :call RunCurrentSpecFile()<CR>
map <Leader>s :call RunNearestSpec()<CR>
map <Leader>l :call RunLastSpec()<CR>
map <Leader>a :call RunAllSpecs()<CR>
{% endhighlight %}

Instalando:

{% highlight bash %}
$ vim +BundleInstall +qall
{% endhighlight %}

Agora no modo normal do vim temos algumas opções para executar o rspec:

{% highlight html %}
\a = roda todas as specs
\t = roda as specs do arquivo atual
\s = roda a(s) spec(s) a partir da linha que o cursor está posicionado
\l = repete o último comando utilizado para rodar a(s) spec(s)
{% endhighlight %}

Bem melhor agora!

Sinta-se livre para alterar o mapeamento como preferir ;).
