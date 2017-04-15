---
layout: post
title: "Configurações de durabilidade no PostgreSQL"
date: 2015-04-26 14:29:00
updated_at: 2017-04-15 11:29
tags: postgresql
---

Bancos de dados relacionais possuem a propriedade de durabilidade, que é um recurso que garante que as transações sejam persistidas mesmo quando o servidor é desligado abruptamente ou algum problema ocorre. Entretanto, durabilidade acrescenta um custo, e de acordo com a documentação do PostgreSQL, o mesmo pode ser configurado para executar mais rápido alterando algumas configurações. A versão utilizada neste post é 9.6.

O que vamos fazer?

* Desabilitar fsync.
* Desabilitar synchronous\_commit.
* Desabilitar full\_page\_writes.
* Aumentar o checkpoint\_timeout.

Todas as opções acima podem ser configuradas no arquivo postgresql.conf com os valores abaixo:

    fsync = off
    synchronous_commit = off
    full_page_writes = off
    checkpoint_timeout = 15min

Após alteração do arquivo, o PostgreSQL deve ser reiniciado.

Essas configurações podem levar a perda ou corrupção de dados, portanto não utilize em produção. Entretanto, a durabilidade ainda é garantida no caso de falhas do software de banco de dados, apenas paradas abruptas do sistema operacional representam risco. O que tornam essas configurações uma boa opção para ambientes de desenvolvimento. Se, por exemplo, você precisa executar muitos testes de integração automatizados, você terá um ganho considerável na velocidade que os mesmos são executados.

Há ainda a opção de executar o PostgreSQL em memória, o que elimina qualquer I/O de disco, porém fica limitado a quantidade de memória e swap disponível.

Mais detalhes: 

[PostgreSQL Non-Durable Settings](http://www.postgresql.org/docs/current/static/non-durability.html)

