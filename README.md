# Santas-De-Roy

[![NPM](https://img.shields.io/npm/v/santas-de-roy.svg)](https://www.npmjs.com/package/santas-de-roy)
[![Build Status](https://travis-ci.org/QuentinRoy/santas-de-roy.svg?branch=master)](https://travis-ci.org/QuentinRoy/santas-de-roy)
[![codecov](https://img.shields.io/codecov/c/github/QuentinRoy/santas-de-roy/master.svg?style=flat)](https://codecov.io/gh/QuentinRoy/santas-de-roy)
[![dependencies Status](https://david-dm.org/QuentinRoy/santas-de-roy/status.svg)](https://david-dm.org/QuentinRoy/santas-de-roy)
[![devDependencies Status](https://david-dm.org/QuentinRoy/santas-de-roy/dev-status.svg)](https://david-dm.org/QuentinRoy/santas-de-roy?type=dev)
[![renovate badge](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovateapp.com/)

A secret Santa API and CLI that takes into account past iterations to avoid re-assignations as much as possible.

## History

It is tradition in my family to run a secret Santa every Christmases. Assignations used to be purely random. Which is good. But there is an issue.

After some years, it happens that I've already got the same Santa a few times while some people never gave me any gifts. I mean, I have nothing against the hand-made sweaters of grand-aunty Josette, but you know, change doesn't hurt...

![Grand aunty's sweater](https://raw.githubusercontent.com/QuentinRoy/santas-de-roy/master/colin.jpg "Grand aunty's sweater")

Alright, that is an [assignment problem](https://en.wikipedia.org/wiki/Assignment_problem). We humans are very bad at that but clever algorithms can solve it. Grand-aunty, I love you. But from now on, let the computer magic takes care of who is my Santa!

## Installation

```
npm install santas-de-roy
```

Original.

If you're only using the CLI and have internet access, you may not need to install it permanently and may want to use [npx](https://www.npmjs.com/package/npx)  (installed by default with node >= 5.2).

## CLI

Santa-De-Roy comes with a Command Line Interface: santas-de-roy.

### Simple usage

If you do not care about history, you can just write down the names of all participants as arguments.
For example:
```
> santas-de-roy Tintin Snowy Haddock Dupond Dupont
santas:
  Tintin: Snowy
  Snowy: Dupond
  Haddock: Bianca
  Dupond: Haddock
  Dupont: Tintin
  Bianca: Dupont
```
That's randomized by default, so if you run it again there is fair chance that nobody is going to have the same Santa again. But there is no guarantee it will not happen. Eventually it will.

### History

But here comes the interesting part. If you provide a data path (YAML or JSON), it will be used to save the results. And next time, will be re-used to *ensure* that nobody will get the same santa twice (as much as possible).

```
> santas-de-roy --data history.yaml Tintin Snowy Haddock Dupond Dupont
2 past christmases found.
santas:
  Tintin: Dupont
  Snowy: Bianca
  Haddock: Dupond
  Dupond: Tintin
  Dupont: Haddock
  Bianca: Snowy
New data written in history.yaml.
```

### Blacklists and config file

Because it can be annoying and error prone to type each year the participants of you secret santa. You may use a config file using the `--config` argument. Here is an example of config file.

```yaml
# Define the participants.
participants:
  - Tintin
  - Snowy
  - Haddock
  - Dupond
  - Dupont
  - Bianca

# Defines blacklist. In the example below, Haddock will not become Bianca's
# Santa, and Bianca will not become the Santa of Dupond or Dupont.
blackLists:
  Haddock:
    - Bianca
  Bianca:
    - Dupond
    - Dupont

# Exclusion groups are another way of defining blacklists. Participants
# part of the same exclusion group cannot be the santa of each others.
exclusionGroups:
  - - Dupond
    - Dupont

# Set up the path toward the history file.
data: history.yaml

# Set up an id for this particular santa assignations. Id's must be unic in the
# history.
id: chistmas2018

# Other available options (same as CLI options, see below).
random: true
dryRun: false
logLevel: info
ignoreHistory: false
quiet: false
```

Config files can be YAML or JSON.

### Other CLI options
```
> santas-de-roy --help

Usage: cli [options] [participants ...]

An application to assign secret santas, optionally taking history into account.


Options:

  -V, --version        output the version number
  -c, --config [path]  set the config path (JSON or YAML)
  -d, --data [path]    set the history path (to be loaded and written, JSON or YAML)
  -d, --dry-run        do not write in the history file
  --ignore-history     ignore the history when computing the new assignations
  --log-level [level]  set the log level
  --no-random          do not randomize the assignations
  -q, --quiet          do not output results
  -i, --id [id]        give an identifier for this christmas to write in the data
  -h, --help           output usage information
```

## API

santas-de-roy is also a library that exports a single function.

### santasDeRoy(options) ⇒ <code>Object.&lt;string, string&gt;</code>

**Returns**: <code>Object.&lt;string, string&gt;</code> - The new assignations.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> \| <code>Array.&lt;string&gt;</code> |  | Options for the generation. Alternatively, an array of participants can be directly provided. |
| [options.participants] | <code>Array.&lt;string&gt;</code> |  | The list of all participants. If omitted, then the participants appearing in exclusionGroups and as a blackLists key will be used. |
| [options.history] | <code>List.&lt;Object.&lt;string, string&gt;&gt;</code> |  | An array containing the previous attributions (dictionaries whose keys are the santas, and values their receiver). |
| [options.blackLists] | <code>Object.&lt;string, Array.&lt;string&gt;&gt;</code> |  | A dictionary whose keys are participants and values a list of participants they cannot be the santa of. |
| [options.exclusionGroups] | <code>Array.&lt;Array.&lt;string&gt;&gt;</code> |  | Exclusion groups of participants. A participant cannot be the santa of someone who is in his exclusion group. |
| [options.randomize] | <code>boolean</code> | <code>true</code> | If true (default), randomizes the assignation algorithm. Makes the output non deterministic. |
