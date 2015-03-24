---
layout: post
title:  "Lista de tarefas nos comentários do Github"
date:   2015-03-23 22:46
tags: github markdown
---

Há pouco tempo descobri que o [Github Flavored Markdown](https://help.github.com/articles/github-flavored-markdown/) possibilita a criação de [listas de tarefas](https://github.com/blog/1375%0A-task-lists-in-gfm-issues-pulls-comments) nos comentários, pull requests e issues. Veja um exemplo:

{% highlight html %}
- [ ] incompleto
- [x] completo
{% endhighlight %}

Simples assim! Basta colocar esses colchetes iniciando cada elemento da lista, com espaço para itens incompletos e um x para completos. Isso vai gerar um lista de tarefas com checkboxes que podem ser marcados e desmarcados sem a necessidade de editar o markdown. 

Isso é bem legal para descrever tarefas em um pull request, por exemplo.

### Links

[Github Flavored Markdown](https://help.github.com/articles/github-flavored-markdown/)

[Task Lists in GFM: Issues/Pulls, Comments](https://github.com/blog/1375%0A-task-lists-in-gfm-issues-pulls-comments)
