// ==UserScript==
// @name         Neopets: Old NeoQuest II: Autoplayer
// @namespace    https://github.com/entropia64x/neopets/
// @version      2.0
// @description  Remote control and trainer for NeoQuest II (Modification of NQ2Guy scripts)
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
// @icon          https://www.google.com/s2/favicons?sz=64&domain=neopets.com
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
  let path = ''; //The path to follow. Works at Level 7.
  let training = 0; //1 = true, 0 = false. Works at Level 7.
  let stop = 0; //1 = true, 0 = false. Works any time.

  //GM_setValue('path', path);
  let pathIndex = GM_getValue('pathIndex', 0);
  let hiccup = document.getElementsByClassName('contentModuleHeader')[0];
  let randomEvent = document.getElementsByClassName('randomEvent')[0];
  if (!hiccup || randomEvent) {
    location.href = 'nq2.phtml';
  } else {
    let frame = document.getElementsByClassName('frame')[0];
    let images = frame.getElementsByTagName('img');
    let links = frame.getElementsByTagName('a');
    let inv = GM_getValue('inv', false);
    let str; //auxiliar variable for strings
    let healingItem = '300';
    let useid = -1;
    let nxactor = 1; // who fights? default = 1: Rohane
    let fact = 3; // default is attack
    let hitTarget = GM_getValue('hitTarget', 5); //hittargets 1-4 are reserved for allies
    let isHasted = GM_getValue('isHasted', false); //True when Mipsy hastes the group
    let isShielding = GM_getValue('isShielding', false); //True when Velm shields the group
    let isTaunted = GM_getValue('isTaunted', false); //True when Rohane taunts.
    let rohaneLevel;

    for (let i = images.length - 1; i >= 0; i--) {
      switch (images[i].src) {
        case 'https://images.neopets.com/nq2/x/nav.gif':
          rohaneLevel = +frame.getElementsByTagName('td')[6].innerHTML;
          if (rohaneLevel == 1) GM_setValue('rohaneLevel', rohaneLevel);
          isTraining();
          checkHealth();
          decidePath(rohaneLevel);
          break;
        case 'https://images.neopets.com/nq2/x/tomap.gif':
          if (inv) {
            cure();
          } else {
            location.href = 'nq2.phtml?finish=1';
          }
          break;
        case 'https://images.neopets.com/nq2/x/com_begin.gif':
          begin();
          break;
        case 'https://images.neopets.com/nq2/x/com_atk.gif':
          checkTarget();
          whoseTurn();
          break;
        case 'https://images.neopets.com/nq2/x/com_next.gif':
          location.href = 'nq2.phtml?&fact=1';
          break;
        case 'https://images.neopets.com/nq2/x/com_end.gif':
          location.href = 'nq2.phtml?&fact=2';
          break;
      }
    }

    function isTraining() {
      if (GM_getValue('rohaneLevel') < 7 && links[1].textContent == 'Hunting') {
          location.href = 'nq2.phtml?act=travel&mode=2';
      }
      switch (GM_getValue('rohaneLevel')) {
        case 1:
          GM_setValue('path', '33334444');
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
          GM_setValue('path', '33333333357111111117111112222262222222268444444444');
          break;
        default:
          if (training) GM_setValue('path', '34');
          break;
      }
    }

    function checkHealth() {
      check: for (let j = 0; j < images.length; j++) {
        switch (images[j].src) {
          case 'https://images.neopets.com/nq2/x/exp_green.gif':
          case 'https://images.neopets.com/nq2/x/exp_yellow.gif':
          case 'https://images.neopets.com/nq2/x/exp_red.gif':
            if (images[j].width <= 42) { //max 75
              GM_setValue('inv', true);
              inv = true;
              break check;
            }
            break;
        }
      }
    }

    function decidePath(rohaneLevel) {
      if(stop) {
        alert('You decided to stop!');
        GM_setValue('path','');
        GM_setValue('pathIndex', 0);
      } else if (inv && rohaneLevel > 4) {
        location.href = 'nq2.phtml?act=inv';
      } else if (pathIndex < GM_getValue('path').length) {
        walk();
      } else {
        GM_setValue('pathIndex', 0);
        if (rohaneLevel >= 7 || rohaneLevel > GM_getValue('rohaneLevel', 1)) {
          if ((!training && rohaneLevel >= 7) || (rohaneLevel < 7 && rohaneLevel > GM_getValue('rohaneLevel', 1))) {
            alert('You have arrived at your destination. Please disable this script to take control.');
          } else if(training) {
            GM_setValue('pathIndex', 1);
            location.href = 'nq2.phtml?act=move&dir=3';
          }
          GM_setValue('rohaneLevel', rohaneLevel);
        } else {
          location.href = 'nq2.phtml?act=talk&targ=10201&say=rest';
        }
      }
    }

    function walk() {
      location.href = 'nq2.phtml?act=move&dir=' + GM_getValue('path')[pathIndex];
      GM_setValue('pathIndex', ++pathIndex);
    }

    function cure() {
      let targ_char = 0;
      let targ_item = 0;
      healthBar: for (let n = 0; n < images.length; n++) {
        switch (images[n].src) {
          case 'http://images.neopets.com/nq2/x/exp_red.gif':
          case 'http://images.neopets.com/nq2/x/exp_yellow.gif':
          case 'http://images.neopets.com/nq2/x/exp_green.gif':
            targ_char++;
            healingItem = '300';
            if (images[n].width <= 42) { //max 75
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
        inv = false;
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
      GM_setValue('isTaunted', false);
      location.href = 'nq2.phtml?start=1';
    }

    function checkTarget() {
      let chTarget = frame.getElementsByClassName('ch')[0].name;
      let chTarget200 = frame.getElementsByClassName('ch200')[0];
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
      let texts = frame.getElementsByTagName('font');
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
      if (texts[j + 1].color == 'red' && GM_getValue('rohaneLevel', 1) >= 7) {
        healRohane();
      } else if (!isTaunted) {
        fact = 9105; //Taunts
        GM_setValue('isTaunted', true);
      }
    }

    function healRohane() {
      fact = 5;
      for (let k = 0; k < links.length; k++) {
        str = links[k].onclick.toString();
        if (str.search("\\(300") != -1) {
          healingItem += str.slice(str.indexOf(300) + 3, str.indexOf(300) + 5);
          break;
        }
      }
    }

    function mipsyAction(texts, j) {
      nxactor = 2;
      fact = 9201; //Direct damage
      if (texts[j + 1].color == '#d0d000' || texts[j + 1].color == 'red') {
        healMipsy(texts, j);
      } else if (!isHasted) {
        fact = 9203; //Haste the Group
        GM_setValue('isHasted', true);
      }
    }

    function healMipsy(texts, j) {
      fact = 5;
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
      nxactor = 3;
      chooseMultipleTargets();
      if (texts[j + 1].color == 'red') {
        healTalinia(texts, j);
      }
    }

    function chooseMultipleTargets() {
      let multipleTargets = /Multiple Targets/;
      for (let k = 0; k < links.length; k++) {
        if (links[k].innerHTML.search(multipleTargets) != -1) {
          fact = 9302;
        }
      }
    }

    function healTalinia(texts, j) {
      fact = 5;
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
      nxactor = 4;
      fact = 9402; // velm heals, trust me you will need this
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
      //loop through all pictures when it's velm's turn
      for (let l = 0; l < images.length; l++) {
        //makes sure the script isn't checking enemies hp
        if (images[l].src == 'http://images.neopets.com/nq2/x/donothing.gif') {
          allies = true;
        } //if checking allies HP
        if (allies) {
          //is the picture a health bar?
          if (images[l].src == 'http://images.neopets.com/nq2/x/exp_green.gif') {
            if (images[l].width >= 30) //45 is full health
            {
              fullhp++;
            }
          }
        }
      }
      return fullhp;
    }

    function checkShielding() {
      if (!isShielding) {
        fact = 9403; //GM_getValue('VelmAction', 9403);
        GM_setValue('isShielding', true);
      } else {
        fact = 3;
      }
    }
  }
})();
