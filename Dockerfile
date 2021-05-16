FROM ruby:2.5

RUN apt-get update -y && apt-get install -y nodejs
WORKDIR /app
ADD . .
RUN bundle i

ENTRYPOINT ["jekyll", "serve"]