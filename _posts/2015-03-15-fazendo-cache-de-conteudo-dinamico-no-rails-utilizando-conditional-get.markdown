---
layout: post
title:  "Fazendo cache de conteúdo dinâmico no Rails utilizando Conditional GET"
date:   2015-03-15 11:02:00
tags: rails cache http
---

Conditional GET é uma especificação do protocolo HTTP que disponibiliza uma forma dos servidores web dizerem para os navegadores que a resposta a uma requisição do tipo GET não mudou desde o último request, e que pode ser carregado a partir cache do navegador.

É de responsabilidade do servidor web verificar os headers HTTP\_IF\_NONE\_MATCH e HTTP\_IF\_MODIFIED\_SINCE e determinar quando enviar uma resposta completa. Com Rails é bem fácil fazer isso, vamos ver um exemplo.

Suponha que você tenha um site de screencasts sobre várias linguagens de programação, frameworks e bibliotecas. Nesse site há uma página para exibir o screencast, e nessa mesma página você faz uma recomendação de vários outros screencasts, mas essa consulta é bem pesada. Uma das formas de resolver isso pode ser usando conditional get. Veja o código abaixo:

{% highlight ruby %}
class ScreencastsController < ApplicationController
  def show
    @screencast = Screencast.find(params[:id])
    if stale?(last_modified: @screencast.updated_at.utc, etag: @screencast.cache_key)
      # consulta custosa de recomendações aqui
    end
  end
end
{% endhighlight %}

Fazemos um if com o método stale? passando a última data de modificação do screencast e o seu cache\_key como etag. O cache\_key é um método do ActiveRecord que irá retornar uma chave combinando os valores do id, classe e updated\_at do objeto. 

O primeiro request a essa página irá realizar a consulta e o navegador irá realizar o cache da página. As chamadas subsequentes irão retornar apenas uma resposta com o status HTTP 304 (Not Modified), e o navegador irá saber que o conteúdo não foi alterado e recarregará do seu próprio cache. 

Quando o screencast for alterado, o valor de updated\_at e cache\_key será diferente, o conteúdo será recarregado pelo servidor, e o navegador vai exibir a nova página e guardar cache com as novas informações.

No exemplo acima, como usamos apenas valores de um model podemos simplificar ainda mais, passando apenas o objeto do ActiveRecord:

{% highlight ruby %}
class ScreencastsController < ApplicationController
  def show
    @screencast = Screencast.find(params[:id])
    if stale?(@screencast)
      # consulta custosa de recomendações aqui
    end
  end
end
{% endhighlight %}

Até aqui só consideramos que as recomendações eram baseadas no screencast. Mas e se as recomendações forem um pouco mais dinâmicas? Utilizando também as categorias preferidas do usuário, por exemplo. Sem problema, só precisamos criar uma chave única para fazer o cache da página. Veja o exemplo abaixo:

{% highlight ruby %}
class ScreencastsController < ApplicationController
  def show
    @screencast = Screencast.find(params[:id])
    etag_key = "#{@screencast.cache_key}-#{current_user.cache_key}"
    if stale?(last_modified: @screencast.updated_at.utc, etag: etag_key)
      # consulta custosa de recomendações aqui
    end
  end
end
{% endhighlight %}

Aqui passamos como etag uma string composta com o cache\_key de screencast e usuário. Assim toda vez que o screencast for alterado, ou o usuário atualizar suas informações, o cache será descartado e o conteúdo personalizado será exibido.

Logo abaixo deixo links para quem quiser ler e entender mais detalhes. Se tiver alguma dúvida deixe nos comentários.

####Links

[Rails Guides: Conditional GET](http://guides.rubyonrails.org/caching_with_rails.html#conditional-get-support)

[Wikipedia: HTTP Etag](http://en.wikipedia.org/wiki/HTTP_ETag)
