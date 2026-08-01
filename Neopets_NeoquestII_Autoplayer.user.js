// ==UserScript==
// @name         Neopets: NeoQuest II: Autoplayer
// @namespace    https://github.com/entropia64x/neoquestII/
// @version      3.3
// @description  Remote control and trainer for NeoQuest II
// @author       entropia64x
// @match        https://www.neopets.com/games/nq2/nq2*
// @grant        GM_log
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_openInTab
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @include      https://www.neopets.com/games/nq2/nq2.phtml*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=neopets.com
// ==/UserScript==

/*
Notes on coordinates

1 = north
2 = south
3 = west
4 = east
5 = northwest
6 = southwest
7 = northeast
8 = southeast
*/

(function() {
  'use strict';
  //Change just these 3 variables
  const path = '';//The path to follow. Works at Level 7.
  const training = 0;//1 = true, 0 = false. Works at Level 7.
  const stop = 1; //1 = true, 0 = false. Works any time.

  let pathIndex = GM_getValue('pathIndex', 0);
  let header = document.querySelector('.contentModuleHeader');
  let randomEvent = document.querySelector('.randomEvent');
  if (!header || randomEvent) {
    location.href = 'nq2.phtml';
  }
  else {
    const frame = document.querySelector('.frame');
    const images = frame.querySelectorAll('img');
    const links = frame.querySelectorAll('a');
    const ACTION = {
      ATTACK: 3,
      USE_ITEM: 5,

      ROHANE_TAUNT: 9105,

      MIPSY_DIRECT_DAMAGE: 9201,
      MIPSY_GROUP_DIRECT_DAMAGE: 9202,
      MIPSY_GROUP_HASTE: 9203,
      MIPSY_SLOWING: 9204,
      MIPSY_DAMAGE_SHIELDS: 9205,

      TALINIA_MULTI: 9302,

      VELM_HEALING: 9401,
      VELM_GROUP_HEALING: 9402,
      VELM_GROUP_SHIELDING: 9403,
      VELM_MESMERIZE: 9404,
      VELM_CELESTIAL_HAMMER: 9405
  };

  const ICON = {
      MAP: 'nav.gif',
      TOMAP: 'tomap.gif',
      BEGIN: 'com_begin.gif',
      ATTACK: 'com_atk.gif',
      NEXT: 'com_next.gif',
      END: 'com_end.gif'
  };

  let str; //auxiliar variable for strings
  let healingItem = '300';
  let useid = -1;

  const ACTOR = {
      ROHANE: 1,
      MIPSY: 2,
      TALINIA: 3,
      VELM: 4
  };

  let nxactor;
  let fact = ACTION.ATTACK; // default is attack
  let hitTarget = GM_getValue('hitTarget', 5); // hittargets 1-4 are reserved for allies
  let isHasted = GM_getValue('isHasted', false); // True when Mipsy hastes the group
  let isShielding = GM_getValue('isShielding', false); // True when Velm shields the group
  let isTaunted = GM_getValue('isTaunted', false); // True when Rohane taunts.

  for (let i = images.length - 1; i >= 0; i--) {
    switch (images[i].src.split('/').at(-1)) {
      case ICON.MAP:
        iconMap();
        break;
      case ICON.TOMAP:
        if (GM_getValue('inv')) {
          healBeforeGo();
        } else {
          location.href = 'nq2.phtml?finish=1';
        }
        break;
      case ICON.BEGIN:
        begin();
        break;
      case ICON.ATTACK:
        checkTarget();
        whoseTurn();
        break;
      case ICON.NEXT:
        location.href = 'nq2.phtml?&fact=1';
        break;
      case ICON.END:
        location.href = 'nq2.phtml?&fact=2';
        break;
    }
  }

  function iconMap() {
    readLevel();
    if (
        GM_getValue('rohaneLevel') > GM_getValue('oldRohaneLevel')
    ) assingSkills();
    if (isHunting()) {
      location.href = 'nq2.phtml?act=travel&mode=2';
    } else {
      if (pathIndex == 0) isTraining();
      checkHealth();
      decidePath();
    }
  }

  function readLevel() {
    let table = frame.querySelector('table');
    GM_setValue('rohaneLevel', +table.rows[1].cells[1].textContent);

    if (GM_getValue('rohaneLevel') == 1 &&
        pathIndex == 0
    ) GM_setValue('oldRohaneLevel', 1);
  }

  function assingSkills() {
    GM_setValue('oldRohaneLevel', GM_getValue('rohaneLevel'));

    switch (GM_getValue('rohaneLevel') % 4) {
      case 2:
        location.href = 'nq2.phtml?act=skills&buy_char=1&buy_char=1&confirm=1&skopt_9102=1';
        break;
      case 3:
        location.href = 'nq2.phtml?act=skills&buy_char=1&buy_char=1&confirm=1&skopt_9101=1';
        break;
      case 0:
        location.href = 'nq2.phtml?act=skills&buy_char=1&buy_char=1&confirm=1&skopt_9104=1';
        break;
      case 1:
        location.href = 'nq2.phtml?act=skills&buy_char=1&buy_char=1&confirm=1&skopt_9107=1';
        break;
    }
  }

  function isHunting() {
    if (
        (GM_getValue('rohaneLevel') < 8 ||
        training) &&
        links[1].textContent == 'Hunting'
    ) return true;

    return false;
  }

  function isTraining() {
    switch (GM_getValue('rohaneLevel')) {
      case 1:
        GM_setValue('path', '33334444')
        break;
      case 2:
        GM_setValue('path', '3333344444');
        break;
      case 3:
        GM_setValue('path', '333333444444');
        break;
      case 4:
        GM_setValue('path', '3333333344444444');
        break;
      case 5:
        GM_setValue('path', '3333333333344444444444');
        break;
      case 6:
      case 7:
        GM_setValue('path', '33333333357111111117111112222262222222268444444444');
        break;
      case 8:
        GM_setValue('path', '3333333335711111111711111188288228228888444444744447777777777177744848822666366626622222222666');
        break;
      default:
        if (training) {
          GM_setValue('path', '34');
        } else {
          GM_setValue('path', path);
        }
        break;
    }
  }

  function checkHealth() {
    GM_setValue('inv', false);

    check: for ( let img of images ) {
      switch (img.src.split('/').at(-1)) {
        case 'exp_green.gif':
        case 'exp_yellow.gif':
        case 'exp_red.gif':
          if (img.width <= 40) { //max 75
            GM_setValue('inv', true);
            break check;
          }
          break;
      }
    }
  }

  function decidePath() {
    if(stop) {
      GM_setValue('path','');
      GM_setValue('pathIndex', 0);
    } else if (GM_getValue('inv') && GM_getValue('rohaneLevel') > 3) {
      location.href = 'nq2.phtml?act=inv';
    } else if (pathIndex < GM_getValue('path').length) {
      walk();
    } else {
      GM_setValue('pathIndex', 0);
      if(training) {
        GM_setValue('pathIndex', 1);
        location.href = 'nq2.phtml?act=move&dir=3';
      } else if (GM_getValue('rohaneLevel') >= 10) {
          alert('You have arrived at your destination.\nPlease disable this script to take control.');
      } else if (GM_getValue('rohaneLevel' < 8)) {
        location.href = 'nq2.phtml?act=talk&targ=10201&say=rest';
      }
    }
  }

  function walk() {
    location.href = 'nq2.phtml?act=move&dir=' + GM_getValue('path')[pathIndex];
    GM_setValue('pathIndex', ++pathIndex);
  }

  function healBeforeGo() {
    let targ_char = 0;
    let targ_item = 0;
    healthBar: for (let img of images) {
      switch (img.src.split('/').at(-1)) {
        case 'exp_red.gif':
        case 'exp_yellow.gif':
        case 'exp_green.gif':
          targ_char++;
          healingItem = '300';
          if (img.width <= 40) { //max 75
            switch (targ_char) {
              case 1: //Rohane: takes the top potion
                cureRohane();
                break;
              case 3: //Talinia: takes the second lowest potion
                cureTalinia();
                break;
              default: //Takes the lowest potion
                cureLowest();
                break;
            }
            targ_item = +healingItem;
            break healthBar;
          }
          break;
      }
    }
    if (healingItem == '300') {
      GM_setValue('inv', false);
      location.href = 'nq2.phtml';
    } else {
      location.href = 'nq2.phtml?act=inv&iact=use&targ_item=' + targ_item + '&targ_char=' + targ_char;
    }
  }

  function cureRohane() {
    for (let j = 0; j < links.length; j++) {
      str = links[j].href.toString();
      if (str.search(300) != -1) {
        healingItem += str.slice(str.indexOf(300) + 3, str.indexOf(300) + 5);
        break;
      }
    }
  }

  function cureTalinia() {
    let secondItem = 0;
    for (let j = links.length - 1; j >= 0; j--) {
      str = links[j].href.toString();
      if (str.search(300) != -1) {
        for (let k = j; k >= 0; k--) {
          if (links[k].href.slice(-1) == '3') secondItem++;
          if (secondItem == 2) {
            str = links[k].href.toString();
            break;
          }
        }
        healingItem += str.slice(str.indexOf(300) + 3, str.indexOf(300) + 5);
        break;
      }
    }
  }

  function cureLowest() {
    for (let m = links.length - 1; m >= 0; m--) {
      str = links[m].href.toString();
      if (str.search(300) != -1) {
        healingItem += str.slice(str.indexOf(300) + 3, str.indexOf(300) + 5);
        break;
      }
    }
  }

  function begin() {
    GM_setValue('hitTarget', 5);
    GM_setValue('isHasted', false);
    GM_setValue('isShielding', false);
    //GM_setValue('isTaunted', false);
    location.href = 'nq2.phtml?start=1';
  }

  function checkTarget() {
    let chTarget = frame.querySelector('.ch').name;
    let chTarget200 = frame.querySelector('.ch200');
    if (chTarget200) chTarget = chTarget200.name;
    switch (chTarget) {
      case 'ch6':
        hitTarget = 6;
        break;
      case 'ch7':
        hitTarget = 7;
        break;
      case 'ch8':
        hitTarget = 8;
        break;
      default:
        hitTarget = 5;
        break;
    }
    GM_setValue('hitTarget', hitTarget);
  }

  function whoseTurn() {
    let texts = frame.querySelectorAll('font');
    for (let j = 0; j < texts.length; j++) {
      switch (texts[j].innerHTML) {
        case '<b>Rohane</b>':
          rohaneAction(texts, j);
          break;
        case '<b>Mipsy</b>':
          mipsyAction(texts, j);
          break;
        case '<b>Talinia</b>':
          taliniaAction(texts, j);
          break;
        case '<b>Velm</b>':
          velmAction(texts, j);
          break;
      }
    }
    useid = +healingItem;
    location.href = 'nq2.phtml?&fact=' + fact + '&target=' + hitTarget + '&use_id=' + useid + '&nxactor=' + nxactor;
  }

  function rohaneAction(texts, j) {
    nxactor = ACTOR.ROHANE;
    if (texts[j + 1].color == 'red' && GM_getValue('rohaneLevel', 1) >= 7) {
      healRohane();
    } //else if (!isTaunted) {
      //fact = ACTION.ROHANE_TAUNTS; //Taunts
      //GM_setValue('isTaunted', true);
    //}
  }

  function healRohane() {
    fact = ACTION.USE_ITEM;
    for (let link of links) {
      str = link.onclick.toString();
      if (str.search("\\(300") != -1) {
        healingItem += str.slice(str.indexOf(300) + 3, str.indexOf(300) + 5);
        break;
      }
    }
  }

  function mipsyAction(texts, j) {
    nxactor = ACTOR.MIPSY;
    fact = ACTION.MIPSY_DIRECT_DAMAGE;
    if (texts[j + 1].color == '#d0d000' || texts[j + 1].color == 'red') {
      healMipsy(texts, j);
    } else if (!isHasted) {
      fact = ACTION.MIPSY_GROUP_HASTE;
      GM_setValue('isHasted', true);
    }
  }

  function healMipsy(texts, j) {
    fact = ACTION.USE_ITEM;
    for (let k = links.length - 1; k >= 0; k--) {
      str = links[k].onclick.toString();
      if (str.search("\\(300") != -1) {
        if (texts[j + 1].color == 'red') str = links[k - 1].onclick.toString();
        if (str.search(300) == -1) str = links[k].onclick.toString();
        healingItem += str.slice(str.indexOf(300) + 3, str.indexOf(300) + 5);
        break;
      }
    }
  }

  function taliniaAction(texts, j) {
    nxactor = ACTOR.TALINIA;
    chooseMultipleTargets();
    if (texts[j + 1].color == 'red') {
      healTalinia();
    }
  }

  function chooseMultipleTargets() {
    let multipleTargets = /Multiple Targets/;
    for (let k = 0; k < links.length; k++) {
      if (links[k].innerHTML.search(multipleTargets) != -1) {
        fact = ACTION.TALINIA_MULTI;
      }
    }
  }

  function healTalinia() {
    fact = ACTION.USE_ITEM;
    for (let k = links.length - 1; k >= 0; k--) {
      str = links[k].onclick.toString();
      if (str.search("\\(300") != -1) {
        str = links[k - 1].onclick.toString();
        if (str.search("\\(300") == -1) str = links[k].onclick.toString();
        healingItem += str.slice(str.indexOf(300) + 3, str.indexOf(300) + 5);
        break;
      }
    }
  }

  function velmAction(texts, j) {
    nxactor = ACTOR.VELM;
    fact = ACTION.VELM_GROUP_HEALING; // Velm heals
    let fullhp = 0; //if its 4 then all 4 people are fully healed
    fullhp = checkHp(fullhp);
    if (fullhp == 4) {
      checkShielding();
    }
    if ((texts[j + 1].color == 'red')) {
      healRohane(texts, j);
    }
  }

  function checkHp(fullhp) {
    let allies = false;
    // Loop through all pictures when it's Velm's turn
    for (let img of images) {
      //makes sure the script isn't checking enemies hp
      if (img.src.split('/').at(-1) == 'donothing.gif') {
        allies = true;
      } //if checking allies HP
      if (allies) {
        //is the picture a health bar?
        if (img.src.split('/').at(-1) == 'exp_green.gif') {
          if (img.width >= 30) //45 is full health
          {
            fullhp++;
          }
        }
      }
    }
    return fullhp;
  }

  function checkShielding() {
    if ( !isShielding ) {
      fact = ACTION.VELM_GROUP_SHIELDING;
      GM_setValue('isShielding', true);
    } else {
      fact = ACTION.ATTACK;
    }
  }

}})();
