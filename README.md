# Anotações do Hercules

Run locally:

    docker-compose build
    docker-compose up

Play with CSS during development:

    docker-compose exec website sass --watch css/style.scss:css/style.css

Generate compressed CSS:

    docker-compose exec website sass -t compressed css/style.scss:css/style.css
