import React from 'react';
import { Product } from '../types';

import tuskerImg from '../assets/images/tusker_lager_bottle_1789650508958.jpg';
import tuskerMaltImg from '../assets/images/tusker_malt_1789652631551.jpg';
import whiteCapImg from '../assets/images/white_cap_beer_1789652644858.jpg';
import pilsnerImg from '../assets/images/pilsner_lager_1789652812874.jpg';
import heinekenImg from '../assets/images/heineken_beer_bottle_1789650526048.jpg';
import guinnessImg from '../assets/images/guinness_draught_bottle_1789650539066.jpg';

import jamesonImg from '../assets/images/jameson_whiskey_1789652658156.jpg';
import johnnieWalkerImg from '../assets/images/johnnie_walker_bottle_1789650575817.jpg';
import jackDanielsImg from '../assets/images/jack_daniels_bottle_1789650591829.jpg';

import smirnoffImg from '../assets/images/smirnoff_vodka_bottle_1789650554500.jpg';
import absolutImg from '../assets/images/absolut_vodka_1789652758193.jpg';

import kenyaCaneImg from '../assets/images/kenya_cane_1789652670237.jpg';
import captainMorganImg from '../assets/images/captain_morgan_bottle_1789650657063.jpg';
import bacardiImg from '../assets/images/bacardi_rum_bottle_1789650604071.jpg';

import gilbeysImg from '../assets/images/gilbeys_gin_1789652683825.jpg';
import gordonsImg from '../assets/images/gordons_gin_bottle_1789650616396.jpg';
import tanquerayImg from '../assets/images/tanqueray_gin_1789652771934.jpg';

import fourthStreetImg from '../assets/images/fourth_street_wine_1789652715028.jpg';
import nederburgImg from '../assets/images/nederburg_wine_1789652826412.jpg';
import jacobsCreekImg from '../assets/images/jacobs_creek_bottle_1789650628104.jpg';

import smirnoffIceBlackImg from '../assets/images/smirnoff_ice_black_1789652700931.jpg';
import baileysImg from '../assets/images/baileys_cream_bottle_1789650670806.jpg';
import whiteClawImg from '../assets/images/white_claw_can_1789650641953.jpg';

import tuskerZeroImg from '../assets/images/tusker_zero_beer_1789652727550.jpg';
import heinekenZeroImg from '../assets/images/heineken_zero_1789652785409.jpg';
import stoneyImg from '../assets/images/stoney_tangawizi_1789652741000.jpg';
import redBullImg from '../assets/images/red_bull_can_1789652799664.jpg';

import cocaColaImg from '../assets/images/coca_cola_bottle_1789656754248.jpg';
import fantaOrangeImg from '../assets/images/fanta_orange_bottle_1789656766347.jpg';
import spriteImg from '../assets/images/sprite_bottle_photo_1789657227275.jpg';
import fantaBlackcurrantImg from '../assets/images/fanta_blackcurrant_1789657241223.jpg';

interface BottleVisualProps {
  type: string;
  className?: string;
  alt?: string;
}

const BOTTLE_IMAGES: Record<string, { src: string; name: string }> = {
  tusker: { src: tuskerImg, name: 'Tusker Lager' },
  tusker_malt: { src: tuskerMaltImg, name: 'Tusker Malt Lager' },
  white_cap: { src: whiteCapImg, name: 'White Cap Lager' },
  pilsner: { src: pilsnerImg, name: 'Pilsner Lager' },
  heineken: { src: heinekenImg, name: 'Heineken Beer' },
  guinness: { src: guinnessImg, name: 'Guinness Foreign Extra Stout' },

  jameson: { src: jamesonImg, name: 'Jameson Irish Whiskey' },
  johnnie_walker: { src: johnnieWalkerImg, name: 'Johnnie Walker Black Label' },
  jack_daniels: { src: jackDanielsImg, name: "Jack Daniel's Old No. 7" },

  smirnoff: { src: smirnoffImg, name: 'Smirnoff No. 21 Red Vodka' },
  absolut: { src: absolutImg, name: 'Absolut Vodka Blue' },

  kenya_cane: { src: kenyaCaneImg, name: 'Kenya Cane Spirit' },
  captain_morgan: { src: captainMorganImg, name: 'Captain Morgan Spiced Rum' },
  bacardi: { src: bacardiImg, name: 'Bacardi Carta Blanca Superior' },

  gilbeys: { src: gilbeysImg, name: "Gilbey's Special Dry Gin" },
  gordons: { src: gordonsImg, name: "Gordon's London Dry Gin" },
  tanqueray: { src: tanquerayImg, name: 'Tanqueray London Dry Gin' },

  fourth_street: { src: fourthStreetImg, name: '4th Street Sweet Red Wine' },
  nederburg: { src: nederburgImg, name: 'Nederburg Baronne' },
  jacobs_creek: { src: jacobsCreekImg, name: "Jacob's Creek Shiraz Cabernet" },

  smirnoff_ice_black: { src: smirnoffIceBlackImg, name: 'Smirnoff Ice Black Guarana' },
  baileys: { src: baileysImg, name: 'Baileys Original Irish Cream' },
  white_claw: { src: whiteClawImg, name: 'White Claw Hard Seltzer' },

  tusker_zero: { src: tuskerZeroImg, name: 'Tusker 0.0% Non-Alcoholic' },
  heineken_zero: { src: heinekenZeroImg, name: 'Heineken 0.0 Alcohol Free' },
  stoney_tangawizi: { src: stoneyImg, name: 'Stoney Tangawizi Ginger Soda' },
  red_bull: { src: redBullImg, name: 'Red Bull Energy Drink' },

  coca_cola: { src: cocaColaImg, name: 'Coca-Cola Original Taste' },
  fanta_orange: { src: fantaOrangeImg, name: 'Fanta Orange' },
  sprite: { src: spriteImg, name: 'Sprite Lemon-Lime' },
  fanta_blackcurrant: { src: fantaBlackcurrantImg, name: 'Fanta Blackcurrant' },
};

export const BottleVisual: React.FC<BottleVisualProps> = ({
  type,
  className = 'h-32',
  alt,
}) => {
  const bottleData = BOTTLE_IMAGES[type];

  if (!bottleData) {
    return null;
  }

  return (
    <img
      src={bottleData.src}
      alt={alt || bottleData.name}
      referrerPolicy="no-referrer"
      loading="lazy"
      className={`object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-105 ${className}`}
    />
  );
};

