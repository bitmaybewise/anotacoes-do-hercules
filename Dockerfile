FROM ruby:2.5

WORKDIR /app
ADD . .
RUN bundle i

ENTRYPOINT ["jekyll", "serve"]
