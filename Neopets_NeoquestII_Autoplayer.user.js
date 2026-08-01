// ==UserScript==
// @name         Neopets: NeoQuest II: Autoplayer
// @namespace    https://github.com/entropia64x/neoquestII/
// @version      3.5
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
  let path = ''; //The path to follow. Works at Level 10.
  let training = 0; //1 = true, 0 = false. Works at Level 10.
  const stop = 0; //1 = true, 0 = false. Works any time.

  const header = document.querySelector('.contentModuleHeader');
  const randomEvent = document.querySelector('.randomEvent');
  if (!header || randomEvent) {
    location.href = 'nq2.phtml';
  } else {
    const frame = document.querySelector('.frame');
    const images = frame.querySelectorAll('img');
    const links = frame.querySelectorAll('a');

    const ACTION = {
      NEXT: 1,
      END: 2,
      ATTACK: 3,
      FLEE: 4,
      USE_ITEM: 5,

      ROHANE_CRIT_ATK: 9101,
      ROHANE_DMG_INCREASE: 9102,
      ROHANE_STUNNING_STRIKES: 9104,
      ROHANE_TAUNT: 9105,
      ROHANE_MAGIC_RESISTANCE: 9501,
      ROHANE_MELEE_HASTE: 9502,

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

    const ACTOR = {
      ROHANE: 1,
      MIPSY: 2,
      TALINIA: 3,
      VELM: 4
    };

    const pathIndex = GM_getValue('pathIndex', 0);
    let hasHealItems = GM_getValue('hasHealItems', true);

    let fact;

    for (let i = images.length - 1; i >= 0; i--) {
      switch (images[i].src.split('/').at(-1)) {
        case ICON.MAP:
          mapIcon();
          break;
        case ICON.TOMAP:
          if (GM_getValue('inv')) {
            healBeforeGo();
          }
          else { // Return to map
            go('nq2.phtml?finish=1');
          }
          break;
        case ICON.BEGIN:
          go('nq2.phtml?start=1');
          break;
        case ICON.ATTACK:
          battle();
          break;
        case ICON.NEXT:
          go(`nq2.phtml?&fact=${ACTION.NEXT}`);
          break;
        case ICON.END:
          go(`nq2.phtml?&fact=${ACTION.END}`);
          break;
      }
    }

    function go(url) {
      location.href = url;
    }
/*====  MAP ICON  ====*/
    function mapIcon() {
      let level = readLevel();
      let oldLevel = GM_getValue('oldRohaneLevel', 1);
      let inv = checkHealth();

      if (inv && hasHealItems) { //Open Inventory
          GM_setValue('inv', inv);
          go('nq2.phtml?act=inv');
      }
      else if (oldLevel < level && level < 40) { //Assing skill
        GM_setValue('oldRohaneLevel', level);
        let skopt = getOption(level);
        go(`nq2.phtml?act=skills&buy_char=1&buy_char=1&confirm=1&skopt_${skopt}=1`);
      }
      else if (isHunting(level)) { //Hunting mode
        go('nq2.phtml?act=travel&mode=2');
      }
      else {
          if (pathIndex == 0) {
            path = getPath(level);
            GM_setValue('path', path);
          }
          decidePath(level);
      }
    }

    function readLevel() {
      let table = frame.querySelector('table');
      let level = +table.rows[1].cells[1].textContent;
      GM_setValue('rohaneLevel', level);

      if (level == 1 && pathIndex == 0) {
        GM_setValue('oldRohaneLevel', 1);
      }

      return level;
    }

    function getOption(level) {
      switch (level % 4) {
        case 0:
          return ACTION.ROHANE_STUNNING_STRIKES;
          break;
        case 1:
          return ACTION.ROHANE_MELEE_HASTE;
          break;
        case 2:
          return ACTION.ROHANE_DMG_INCREASE;
          break;
        case 3:
          return ACTION.ROHANE_CRIT_ATK;
          break;
      }
    }

    function isHunting(level) {
      if (
          (level < 10 ||
          training) &&
          links[1].textContent == 'Hunting'
      ) {
        return true;
      }
      return false;
    }

    function getPath(level) {
      let first;
      switch (level) {
        case 1:
          return '33334444';
          break;
        case 2:
          return '3333344444';
          break;
        case 3:
          return '333333444444';
          break;
        case 4:
          return '3333333344444444';
          break;
        case 5:
          return '333333333331212121244444444444';
          break;
        case 6:
        case 7:
          GM_setValue('first', true);
          return '33333333357111111117111112222262222222268444444444';
          break;
        case 8:
          first = GM_getValue('first', true);
          if (first) {
            GM_setValue('first', false);
            return '3333333335711111111711111188288228228888444444744447777777777177744848822666366626622222222662';
          }
          else {
            return '34';
          }
          break;
        case 9:
          GM_setValue('first', true);
          return '34';
          break;
        case 10:
          first = GM_getValue('first', true);
          if (first) {
            GM_setValue('first', false);
            return '62222663333333333363333366666622222844444444444444484444888888884444844444482666333';
          }
          else if (training){
            return '34';
          }
          else {
            return path;
          }
          break;
        default:
          if (training) {
            return '34';
          }
          else {
            return path;
          }
          break;
      }
    }

    function checkHealth() {
      for (let img of images) {
        switch (img.src.split('/').at(-1)) {
          case 'exp_green.gif':
          case 'exp_yellow.gif':
          case 'exp_red.gif':
            if (img.width <= 45) { //Max 75
              return true;
            }
        }
      }
      return false;
    }

    function decidePath(level) {
      if (stop) {
        GM_setValue('path','');
        restartPathIndex();
      }
      else if (pathIndex < GM_getValue('path').length) { //Move
        const direction = nextMove();
        GM_setValue("pathIndex", pathIndex + 1);
        go(`nq2.phtml?act=move&dir=${direction}`);
      }
      else if (training || (level == 8 && !GM_getValue('first')) || level == 9) {
        GM_setValue('pathIndex', 1);
        go('nq2.phtml?act=move&dir=3'); //Move left
      }
      else {
        restartPathIndex();
        if (level < 8) { //Rest with mother
          go('nq2.phtml?act=talk&targ=10201&say=rest');
        }
        else if (level > 10 || (level == 10 && !GM_getValue('first'))) { //Finish
          let msg = 'You have arrived at your destination.\n';
          msg += 'Please disable this script to take control.';
          alert(msg);
        }
      }
    }

    function restartPathIndex() {
      //GM_setValue('path','');
      GM_setValue('pathIndex', 0);
    }

    function nextMove() {
      return GM_getValue('path')[pathIndex];
    }
/*=====  INVENTORY  ====*/
    function healBeforeGo() {
      let itemTable = frame.querySelectorAll('table')[3];
      let [lowest, row] = lookForLowestPoints(itemTable);
      if (!lowest) {
        GM_setValue('hasHealItems', false);
        go('nq2.phtml');
      }
      else {
        let [char, hp] = whoNeedsCure(lowest);
        if (char == -1) {
          GM_setValue('inv', false);
          go('nq2.phtml');
        }
        else if (!hp) {
            resurrect();
        }
        else {
          let id = getLowestId(itemTable, row);
          if (id) {
            GM_setValue('hasHealItems', true);
            go(`nq2.phtml?act=inv&iact=use&targ_item=${id}&targ_char=${char+1}`);
          }
          else {
            GM_setValue('hasHealItems', false);
             go('nq2.phtml');
          }
        }
      }
    }

    function lookForLowestPoints(itemTable) {
      let heal_points;
      let str;
      for (let i = itemTable.rows.length - 1; i > 0; i--) {
        str = itemTable.rows[i].cells[2].textContent;
        heal_points = str.match(/heal (\d+)/);
        if (heal_points != null) {
          GM_setValue('hasHealItems', true);
          return [+heal_points[1], i];
        }
      }
      GM_setValue('hasHealItems', false);
      return [false, false];
    }

    function whoNeedsCure(lowest) {
      const partyTable = frame.querySelector('table');
      let char = -1;
      let hp$full;
      let hp;
      let full;
      for (let row = 0; row < partyTable.rows.length - 1; row += 2) {
        char += 1;
        hp$full = partyTable.rows[row].cells[6].textContent.split('/');
        hp = +hp$full[0];
        full = +hp$full[1];
        if (full - hp > lowest) {
          return [char, hp];
        }
      }
      return [-1, 1];
    }

    function resurrect() {
      links = frame.querySelectorAll('a');
      for (let link of links) {
        if (link.href.includes(304)) {
          go(link.href);
          break;
        }
      }
    }

    function getLowestId(itemTable, row) {
      let str;
      if (row) {
        str = itemTable.rows[row].cells[3].innerHTML;
        return str.match(/targ_item=(\d+)/)[1];
      }
      return false;
    }
    
/*====  BATTLE ====*/
    function battle() {
      let fonts = frame.querySelectorAll('font');
      let [nxactor, font] = whoseTurn(fonts);
      let orange = '#d0d000';

      if (font.color == 'red' ||
          (nxactor == ACTOR.MIPSY && font.color == orange))
          {
        healOrFlee(nxactor, font);
      }
      else {
        let hitTarget = getTarget();
        switch(nxactor) {
          case ACTOR.ROHANE:
            rohaneAction(nxactor, hitTarget);
            break;
          case ACTOR.MIPSY:
            mipsyAction(nxactor, hitTarget);
            break;
          case ACTOR.TALINIA(nxactor, hitTarget):
            taliniaAction(nxactor);
            break;
          case ACTOR.VELM:
            velmAction(nxactor, hitTarget);
            break;
        }
      }
    }

    function whoseTurn(fonts) {
      for (let i = 0; i < fonts.length; i++) {
        switch (fonts[i].innerHTML) {
          case '<b>Rohane</b>':
            return [ACTOR.ROHANE, fonts[i + 1]];
            break;
          case '<b>Mipsy</b>':
            return [ACTOR.MIPSY, fonts[i + 1]];
            break;
          case '<b>Talinia</b>':
            return [ACTOR.TALINIA, fonts[i + 1]];
            break;
          case '<b>Velm</b>':
            return [ACTOR.VELM, fonts[i + 1]];
            break;
        }
      }
    }

    function healOrFlee(nxactor, font) {
      fact = ACTION.USE_ITEM;
      let hp$full = font.textContent.match(/(\d+)\/(\d+)/);
      let hp = +hp$full[1];
      let full = +hp$full[2];
      let [healPoints, td] = searchBestPoints(full - hp);
      if (!healPoints) {
        let msg = 'Stopped due to lack of potions.\n';
        msg += `Path=${GM_getValue('path')}, pathIndex=${GM_getValue('pathIndex')}`;
        alert(msg);
        GM_setValue('hasHealItems', false);
        GM_setValue('pathIndex', 0);
        GM_setValue('path', '');
        go(`q2.phtml?&fact=${ACTION.FLEE}`);
      }
      else {
        let useid = getPotionCode(healPoints, td);
        go(`nq2.phtml?&fact=${fact}&use_id=${useid}&nxactor=${nxactor}`);
      }
    }

    function searchBestPoints(dif) {
      const tds = frame.querySelectorAll('td');
      let allPoints;
      let best = false;
      let td;
      for (td of tds) {
        allPoints = td.textContent.match(/heal (\d+)/g);
        if (allPoints) break;
      }
      let points;
      for (let healpoints of allPoints.reverse()) {
        points = +healpoints.match(/\d+/);
        if (dif > points || !best) {
          best = points;
        }
      }
      return [best, td];
    }
    
    function getPotionCode(healPoints, td) {
      let link = td.querySelector('a');
      return link.onclick.toString().match(/300\d+/);
    }

    function getTarget() {
      let chTarget = frame.querySelector('.ch').name;
      let chTarget200 = frame.querySelector('.ch200');
      if (chTarget200) chTarget = chTarget200.name;
      switch (chTarget) {
        case 'ch6':
          return 6;
          break;
        case 'ch7':
          return 7;
          break;
        case 'ch8':
          return 8;
          break;
        default:
          return 5;
          break;
      }
    }
    
    function rohaneAction(nxactor, hitTarget) {
      fact = ACTION.ATTACK;
      go(`nq2.phtml?&fact=${fact}&target=${hitTarget}&nxactor=${nxactor}`);
    }

    function mipsyAction(nxactor, hitTarget) {
      if (isCasted(/Hasted/)) {
        fact = ACTION.MIPSY_GROUP_HASTE;
        go(`nq2.phtml?&fact=${fact}`);
      }
      else {
        fact = ACTION.MIPSY_DIRECT_DAMAGE;
        go(`nq2.phtml?&fact=${fact}&target=${hitTarget}&nxactor=${nxactor}`);
      }
    }

    function taliniaAction(nxactor, hitTarget) {
      fact = ACTION.ATTACK;
      let multipleTargets = /Multiple Targets/;
      const links = frame.querySelectorAll('a');
      for (let link of links) {
        if (link.innerHTML.search(multipleTargets) != -1) {
          fact = ACTION.TALINIA_MULTI;
          break;
        }
      }
      go(`nq2.phtml?&fact=${fact}&target=${hitTarget}&nxactor=${nxactor}`);
    }

    function velmAction(nxactor, hitTarget) {
      let actorsHealed = checkGroupHp();
      if (actorsHealed < 4) {
        fact = ACTION.VELM_GROUP_HEALING;
        go(`nq2.phtml?&fact=${fact}`)
      }
      else if (!isCasted(/Def/)){
        fact = ACTION.VELM_GROUP_SHIELDING;
        go(`nq2.phtml?&fact=${fact}`);
      }
      else {
        fact = ACTION.ATTACK;
        go(`nq2.phtml?&fact=${fact}&target=${hitTarget}&nxactor=${nxactor}`);
      }
    }
    
    function isCasted(magic) {
      const tds = frame.querySelectorAll('td');
      const msg = /Messages/;
  
      for (let i = tds.length - 1; i > 0; i--) {
        if (tds[i].textContent.search(magic)) {
          return true;
        }
        if (tds[i].textContent.search(msg)) {
          return false;
        }
      }
    }
    
    function checkGroupHp() {
      let actorsHealed = 0;
      let allies = false;
      for (let img of images) {
        if (img.src.split('/').at(-1) == 'donothing.gif') {
          allies = true;
          continue;
        }
        if (allies) {
          if (img.src.split('/').at(-1) == 'exp_green.gif') {
            if (img.width >= 30) //45 is full health
            {
              actorsHealed++;
            }
          }
        }
      }
      return actorsHealed;
    }
  }
})();
