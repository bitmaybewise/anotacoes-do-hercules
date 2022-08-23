FROM ruby:3.1

RUN apt-get update -y && apt-get install -y nodejs
WORKDIR /app
ADD . .
RUN bundle i
