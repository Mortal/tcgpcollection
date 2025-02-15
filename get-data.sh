#!/bin/sh
for i in abilities cards expansions moves pack-cards packs rarities types; do
	curl -G -s "https://pokemonpocket.tcg.wiki:4000/api/$i" -d depth=0 -d limit=5000 > public/$i.json || exit 1
done
