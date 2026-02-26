# Getting Started (Guided)

## Purpose
- Start quickly after cloning.
- Create your own SuperCharli role/personality/background profile.
- Keep memory data outside repository.

## Config Layers
- Repo base profile: `config/charli.profile.base.json`
- User override: `~/.config/supercharli/charli.profile.json`
- Runtime merges both (user override wins).

## Steps
1. Run:
```bash
npm run init:user
```
2. Fill provider settings in `~/.config/supercharli/providers.config.json`
3. Fill keys in `~/.config/supercharli/supercharli.env.sh`
4. Start:
```bash
source ~/.config/supercharli/supercharli.env.sh
scripts/supercharli-runtime.sh start
scripts/supercharli-runtime.sh cli
```
