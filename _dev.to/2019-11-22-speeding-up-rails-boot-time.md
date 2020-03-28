# Speeding up Rails boot time

Blog post originally written at https://eng.fromatob.com/post/2019/11/speeding-up-rails-boot-time/

## Introduction

Usually when we have a small Rails application, or are starting a new project, we don't have such a problem as slow boot time. At this point our app is using just a few libraries, logic has not evolved into a big monster, not many feature/integration tests... easy peasy!!!

But then comes the day when you dread doing a change on your codebase. A single small change means an endless waiting time to boot the web app or to run a single unit test. I know, it is just "a few seconds", but it seems like an eternity when you need the good and old fast feedback of unit tests. Slow feedback during this process might end up frustrating team members trying to get things done.

Here at fromAtoB we had a problem like that:

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

Not a pleasant experience to be honest. But we did some small tweaks and managed to improve this time drastically!

It is not anything special or unknown to the Rails community. The things listed here come by default on newer versions of Rails. But if you're still working on legacy versions of Rails, might be worth to take a look and see if you've done this already.

## Bootsnap to the rescue

[Bootsnap](https://github.com/Shopify/bootsnap) is a library developed by Shopify to optimize and cache expensive computations.

Shopify platform, which is a big monolith, was able to [drop boot time by 75%](https://github.com/Shopify/bootsnap#performance). Ours is also a monolith yet, and just by adding bootsnap we managed to cut boot time in a half:

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

In order to do that add the gem to the Gemfile:

```ruby
gem 'bootsnap', require: false
```

And set it up on the `config/boot.rb` file:

```ruby
require 'bootsnap/setup'
```

Bootsnap does not clean up its own cache though. If you want to get around it and still use it in some situations you will probably want to add a toggle. One way would be such as:

```ruby
require 'bootsnap/setup' unless ENV['DISABLE_BOOTSNAP'].present?
```

It is configurable also. If you need to know more on how to tweak its configuration, check it out: https://github.com/Shopify/bootsnap#usage

Adding bootsnap will improve boot time for all environments.

Bootsnap comes by default on Rails 5.2+.

We still can improve more for local development...

## Spring

> Spring is a Rails application preloader. It speeds up development by keeping your application running in the background so you don't need to boot it every time you run a test, rake task or migration.

Spring description speaks by itself.

Add to your Gemfile:

```ruby
gem "spring", group: :development
```

And `springify` your executables in your `bin/` folder:

```bash
$ bundle install
$ bundle exec spring binstub --all
```

If you use RSpec add also this gem to the Gemfile:

```ruby
gem 'spring-commands-rspec', group: :development
```

And generate the binstub for it:

```bash
$ bundle exec spring binstub rspec
```

In the first run you're not going to see much of a difference as the app is not preloaded yet:

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

But after the first run it'll be much better:

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

No need to do anything different, just remember to use the binstubs generated on `bin/` folder.

Spring comes by default since Rails 5+.

For more information: https://github.com/rails/spring

## Not just Rails

These changes aren't specific to Rails only. Here in this tutorial the configurations are related to Rails but if you have a Ruby application, have a look at the readmes of both gems and you'll be able to use them without much effort, they are straighforward to use and configure.

## Other tips

Add `require: false` for gems that don't need to be loaded automatically. Example:

```ruby
gem 'rubocop', require: false
```

Rubocop is on Gemfile just to support development and CI, to track the quality of code written. You don't need to load this gem on your Ruby app. We can save some memory and boot time by paying attention to this.

Be mindful about dependencies. Libraries and frameworks are really helpful, and we need them to be productive at work, but there are some cases where we only need a function or a few lines of code, and in this case is ok to copy+paste from somewhere. As we add more dependencies, we become more constrained as time passes when dealing with upgrades, one library can depend of other(s) and if it stops being maintained we might end up having to dedicate more time to get rid of it later on.
