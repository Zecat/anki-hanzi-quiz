# anki-hanzi-quizz

Anki card template to learn Chinese character strokes.

> This project is a work in progress

## Card Interface

TODO add images

## How use the card template

TODO add explanation

## Add your own card with [Pleco](https://play.google.com/store/apps/details?id=com.pleco.chinesesystem&pli=1) easily

TODO add explanation

# Dev

## Character morph structure

- retreive character data
  - strokes
  - acjk decomposition
  - other data (pinyin, definition...)
- compute component object decomposition
- stroke morphing
- character grid
  - interaction
  - positioning
- recursive auto opening of component without associated character

## Automatic build, anki template update and sync

### Overwrite warning

Be aware that this will overwrite the template of the card and sync anki remotely

### Setup

copy `./scripts/update_anki_template/.env_example` to `./scripts/update_anki_template/.env` and fill the variable

### run

Ensure anki desktop is closed then run

``` sh
npm run anki
```
