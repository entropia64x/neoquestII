// ==UserScript==
// @name         Neopets: NeoQuest II: Autoplayer
// @namespace    https://github.com/entropia64x/neoquestII/
// @version      3.14
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

(function () {
  'use strict';
  //Change just these 3 variables
  let path = '5155335555555553333366666633333555551117111111155335553666666666662666333'; //The path to follow. Works at Level 10.
  let training = 0; //1 = true, 0 = false. Works at Level 10.
  const stop = 0; //1 = true, 0 = false. Works any time.

  const maintenance = document.querySelector('#maintenance-container');
  const content = document.querySelector('.contentModule');
  const randomEvent = document.querySelector('.randomEvent');

  function go(url = '') {
    url = `nq2.phtml${url}`;
    location.href = url;
  }

  if (maintenance) {
    return;
  } else if (!content || randomEvent) {
    go();
  } else {
    /*=============================  CONSTANTS  =============================*/

    const frame = content.querySelector('.frame');
    const images = frame.querySelectorAll('img');

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
      VELM_CELESTIAL_HAMMER: 9405,
    };

    const ACTOR = {
      Rohane: 1,
      Mipsy: 2,
      Talinia: 3,
      Velm: 4,
    };

    const bosses = [
      'Miner Foreman',
      'Zombom',
      'Giant Sand Grundo',
      'Ramtor',
      'Leximp',
      'Kolvars',
      'Scuzzy',
      'Siliclast',
      'Gebarn II',
      'Revenant of the Dunes',
      "Coltzan's Ghost",
      'Anubits',
      'Meuka',
      'Spider Grundo',
      'a Dark Faerie',
      'a Fire Faerie',
      'a Water Faerie',
      'an Earth Faerie',
      'Hubrid Nox',
      'the Esophagor',
      'The Fallen Angel',
      'Devilpuss',
      'the Faerie Thief',
      'a Pant Devil',
      'King Terask',
    ];

    const ICONS = {
      'nav.gif': mapIcon,
      'tomap.gif': toMap,
      'com_begin.gif': begin,
      'com_atk.gif': battle,
      'com_next.gif': next,
      'com_end.gif': end,
      'cont.gif': toMap,
    };

    const POTIONS = {
      heal: {
        regexPoints: /heal (\d+)/g,
        codes: {
          15: 30011,
          25: 30012,
          35: 30013,
          50: 30014,
          60: 30021,
          70: 30022,
          80: 30023,
          90: 30031,
          100: 30032,
          110: 30033,
          120: 30041,
          130: 30042,
          140: 30043,
          150: 30051,
          160: 30052,
          170: 30053,
        },
      },

      dmg: {
        regexPoints: /dmg (\d+)/g,
        codes: {
          15: 30100,
          25: 30101,
          35: 30102,
          50: 30103,
          65: 30104,
          80: 30105,
          95: 30106,
          110: 30107,
          125: 30108,
          140: 30109,
          155: 30110,
          170: 30111,
        },
      },
    };

    /*==============================  MAIN FOR  ==============================*/

    for (let i = images.length - 1; i >= 0; i--) {
      let icon = ICONS[images[i].src.split('/').at(-1)];

      if (icon) {
        icon();
        break;
      }
    }

    /*=============================  NAVIGATION  =============================*/

    function goJS(submit) {
      location.href = `javascript:${submit}`;
    }

    function begin() {
      go('?start=1');
    }

    function next() {
      goJS(`setaction(${ACTION.NEXT}); document.ff.submit();`);
    }

    function end() {
      goJS(`setaction(${ACTION.END}); document.ff.submit();`);
    }

    function toMap() {
      if (GM_getValue('inv')) {
        healBeforeGo();
      } else {
        // Return to map
        go('?finish=1');
      }
    }

    /*================================  MAP  ================================*/

    function mapIcon() {
      let inv = whoNeedsCure(GM_getValue('lowest', 15), 'Health')[0];

      if (openInventory(inv)) {
        return;
      }

      const level = readLevel();

      if (assingSkill(level)) {
        return;
      }

      if (isHunting(level)) {
        go('?act=travel&mode=2');
        return;
      }

      decidePath(level);
    }

    function openInventory(inv) {
      if (inv && GM_getValue('hasHealItems', true)) {
        GM_setValue('inv', true);
        go('?act=inv');
        return true;
      }

      return false;
    }

    function readLevel() {
      let table = frame.querySelector('table');
      let level = +table.rows[1].cells[1].textContent;

      if (level == 1 && GM_getValue('oldRohaneLevel', 60) != 1) {
        GM_setValue('oldRohaneLevel', 1);
      }

      return level;
    }

    function assingSkill(level) {
      const oldLevel = GM_getValue('oldRohaneLevel', 1);

      if (oldLevel < level) {
        if ([7, 9].includes(level)) {
          GM_setValue('first', true);
        }

        GM_setValue('oldRohaneLevel', level);
        let skopt = getSkill(level);
        go(`?act=skills&buy_char=1&buy_char=1&confirm=1&skopt_${skopt}=1`);
        return true;
      }

      return false;
    }

    function getSkill(level) {
      const skills = [
        ACTION.ROHANE_STUNNING_STRIKES,
        ACTION.ROHANE_MELEE_HASTE,
        ACTION.ROHANE_DMG_INCREASE,
        ACTION.ROHANE_CRIT_ATK,
      ];

      return skills[level % 4];
    }

    function isHunting(level) {
      if ((level < 10 || training) && isHuntingLinkActive()) {
        return true;
      }

      return false;
    }

    function isHuntingLinkActive() {
      const links = frame.querySelectorAll('a');

      for (let link of links) {
        if (link.textContent.includes('Hunting')) {
          return true;
        }
      }

      return false;
    }

    function getPath(level) {
      const paths = {
        1: '33334444',
        2: '3333344444',
        3: '333333444444',
        4: '3333333344444444',
        5: '333333333331212121244444444444',
        6: '33333333357111111117111113434342222262222222268444444444',
        7: '33333333357111111117111113434343434343434342222262222222268444444444',
        8: '3333333335711111111711111188288228228888444444744447777777777177744848822666366626622222222662',
        10: getFirstPath(
          '2222663333333333363333366666622222844444444444444484444888888884444844444482666333',
          training ? '34' : path
        ),
      };

      return paths[level] ?? (training ? '34' : path);
    }

    function getFirstPath(firstPath, otherPath) {
      if (GM_getValue('first', true)) {
        GM_setValue('first', false);
        return firstPath;
      }

      return otherPath;
    }

    function decidePath(level) {
      const pathIndex = GM_getValue('pathIndex', 0);

      if (pathIndex == 0) {
        path = getPath(level);
        GM_setValue('path', path);
      }

      if (stop) {
        GM_setValue('path', '');
        restartPathIndex();
        return;
      }

      //Move
      if (pathIndex < GM_getValue('path').length) {
        const direction = nextMove(pathIndex);
        GM_setValue('pathIndex', pathIndex + 1);
        goJS(`dosub(${direction})`);
        return;
      }

      if ((level == 8 && GM_getValue('path') == '34') || level == 9) {
        training = 1;
      }

      if (training) {
        GM_setValue('pathIndex', 1);
        goJS('dosub(3)'); //Move left
        return;
      }

      restartPathIndex();

      //Stop
      if ((level > 10 || (level == 10 && !GM_getValue('first'))) && GM_getValue('path', true)) {
        let msg = 'You have arrived at your destination.\n';
        msg += 'Please disable this script to take control.';
        alert(msg);
        return;
      }

      //Rest with mother
      if (level < 8) {
        go('?act=talk&targ=10201&say=rest');
        return;
      }

      if (level == 8 && GM_getValue('first')) {
        GM_setValue('first', false);
        go('?act=talk&targ=10201&say=rest');
        return;
      }

      if (level == 8 && !GM_getValue('first')) {
        GM_setValue('path', '34');
        GM_setValue('pathIndex', 1);
        goJS('dosub(3)');
        return;
      }

      if (level == 10 && GM_getValue('first')) {
        goJS('dosub(6)');
        return;
      }
    }

    function nextMove(pathIndex) {
      return GM_getValue('path')[pathIndex];
    }

    function restartPathIndex() {
      GM_setValue('pathIndex', 0);
    }

    /*=============================  INVENTORY  =============================*/

    function healBeforeGo() {
      const [id, lowest] = lookForBestPotion(0, 'heal');

      if (!id) {
        go();
        return;
      }

      let [char, hp] = whoNeedsCure(lowest, 'Rohane');

      if (!char) {
        GM_setValue('inv', false);
        go();
      } else if (!hp) {
        resurrect();
      } else {
        go(`?act=inv&iact=use&targ_item=${id}&targ_char=${char}`);
      }
    }

    function whoNeedsCure(lowest, word) {
      const partyTable = getTable(word);
      const tds = partyTable.querySelectorAll('td');
      let char = 0;
      let health;
      let hp;
      let full;

      for (let td of tds) {
        health = td.textContent.match(/(\d+)\/(\d+)/);

        if (health) {
          char += 1;
          hp = +health[1];
          full = +health[2];

          if (full - hp > lowest) {
            return [char, hp];
          }
        }
      }

      return [0, 0];
    }

    function lookForBestPotion(dif, type) {
      const itemTable = getTable(type);

      if (!itemTable) {
        if (type == 'heal') {
          GM_setValue('hasHealItems', false);
        }

        return [false, false];
      }

      const potion = POTIONS[type];

      let allPoints = itemTable.textContent.match(potion.regexPoints);
      let points = 0;
      let best = false;

      for (let i = allPoints.length - 1; i >= 0; i--) {
        points = +allPoints[i].match(/\d+/);

        if (type == 'heal' && i == allPoints.length - 1) {
          GM_setValue('lowest', points);
        }

        if (dif > points || !best) {
          best = potion.codes[points];

          if (!dif) {
            break;
          }
        }
      }

      return [best, points];
    }

    function resurrect() {
      const links = frame.querySelectorAll('a');

      for (let link of links) {
        if (link.href.includes(304)) {
          go(link.href);
          break;
        }
      }
    }

    /*===============================  BATTLE ===============================*/

    function battle() {
      const battleState = setBattleState();
      const nxactor = battleState.actor;
      const color = battleState.color;
      const orange = '#d0d000';

      if (color == 'red' || (nxactor == ACTOR.Mipsy && color == orange)) {
        healOrFlee(battleState);
        return;
      }

      const actorsActions = {
        [ACTOR.Rohane]: rohaneAction,
        [ACTOR.Mipsy]: mipsyAction,
        [ACTOR.Talinia]: taliniaAction,
        [ACTOR.Velm]: velmAction,
      };

      let action = ACTION.ATTACK;
      let id = false;

      [action, id] = actorsActions[nxactor](action, id, battleState);

      let submit = `settarget(${battleState.target}); `;
      submit += `setaction(${action}); `;
      submit += `setitem(${id}); `;
      submit += `setch(ch${nxactor}); document.ff.submit();`;
      goJS(submit);
    }

    function setBattleState() {
      const form = frame.querySelector('FORM');
      const fonts = frame.querySelectorAll('font');
      const tds = frame.querySelectorAll('td');
      const tds1 = tds[0].querySelectorAll('td');
      const links = frame.querySelectorAll('a');

      const nxactor = nextActor(form);
      const hpInfo = getHpInfo(nxactor, fonts);
      const textColor = hpInfo.color;
      const hpArray = hpInfo.textContent.match(/(\d+)\/(\d+)/);
      const hp = +hpArray[1];
      const fullhp = +hpArray[2];

      let battleState = {
        actor: nxactor,
        color: textColor,
        healPotion: lookForBestPotion(fullhp - hp, 'heal')[0],
        isBoss: isBoss(tds1),
        target: getTarget(links),
      };

      if (battleState.isBoss) {
        battleState.dmgPotion = lookForBestPotion(0, 'dmg')[0];
        battleState.slowPotion = lookForSlowPotion();
        battleState.isSlowed = isSlowed(tds1);
      }

      if (nxactor == ACTOR.Mipsy) {
        battleState.canHaste = isLink('Group Haste', links);
        battleState.canShield = isLink('Damage Shields', links);

        battleState.hasted = isCasted('Haste', tds);
        battleState.dmgShields = isCasted('Damage Shield', tds);
      }

      if (nxactor == ACTOR.Talinia) {
        battleState.multipleTargets = isLink('Multiple Targets', links);
      }

      if (nxactor == ACTOR.Velm) {
        battleState.actorsHealed = actorsHealed();
        battleState.areProtected = isCasted('Def', tds);
      }

      return battleState;
    }

    function getTarget(links) {
      let target = 5;

      for (let link of links) {
        target = +link.onclick.toString().match(/settarget\((\d+)\)/)[1];

        if (target) break;
      }

      return target;
    }

    function healOrFlee(battleState) {
      const id = battleState.healPotion;
      const nxactor = battleState.actor;

      if (id) {
        heal(id, nxactor);
        return;
      }

      flee();
    }

    function heal(id, nxactor) {
      GM_setValue('hasHealItems', true);
      go(`?&fact=${ACTION.USE_ITEM}&use_id=${id}&nxactor=${nxactor}`);
    }

    function flee() {
      let msg = 'Stopped due to lack of heal potions.\n';
      msg += `Path=${GM_getValue('path')}, pathIndex=${GM_getValue('pathIndex')}`;
      alert(msg);
      GM_setValue('hasHealItems', false);
      GM_setValue('pathIndex', 0);
      GM_setValue('path', '');
      go(`?&fact=${ACTION.FLEE}`);
    }

    /*=========================  CHARACTER ACTIONS  =========================*/

    function rohaneAction(action, id, battleState) {
      if (battleState.isBoss) {
        if (battleState.isSlowed) {
          id = battleState.slowPotion;
        }

        if (!id) {
          id = battleState.dmgPotion;
        }

        if (id) {
          action = ACTION.USE_ITEM;
        }
      }

      return [action, id];
    }

    function mipsyAction(action, id, battleState) {
      action = ACTION.MIPSY_DIRECT_DAMAGE;

      if (battleState.canHaste && !battleState.hasted) {
        action = ACTION.MIPSY_GROUP_HASTE;
      } else if (battleState.canShield && !battleState.dmgShields) {
        action = ACTION.MIPSY_DAMAGE_SHIELDS;
      } else if (battleState.isBoss && !battleState.isSlowed) {
        id = battleState.slowPotion;

        if (id) {
          action = ACTION.USE_ITEM;
        }
      }

      return [action, id];
    }

    function taliniaAction(action, id, battleState) {
      if (battleState.isBoss && !battleState.isSlowed) {
        id = battleState.slowPotion;

        if (id) {
          action = ACTION.USE_ITEM;
        }
      } else if (battleState.multipleTargets) {
        action = ACTION.TALINIA_MULTI;
      }

      return [action, id];
    }

    function velmAction(action, id, battleState) {
      if (battleState.actorsHealed < 4) {
        action = ACTION.VELM_GROUP_HEALING;
      } else if (!battleState.areProtected) {
        action = ACTION.VELM_GROUP_SHIELDING;
      } else {
        [action, id] = rohaneAction(action, id, battleState);
      }

      return [action, id];
    }

    /*==========================  BATTLE QUERIES  ===========================*/

    function nextActor(form) {
      for (let i = form.length - 1; i >= 0; i--) {
        if (form[i].name == 'nxactor') {
          return +form[i].value;
        }
      }
    }

    function getNameByValue(object, value) {
      return Object.keys(object).find((key) => object[key] === value);
    }

    function getHpInfo(nxactor, fonts) {
      const name = getNameByValue(ACTOR, nxactor);

      for (let i = fonts.length - 1; i > 0; i--) {
        if (fonts[i].textContent.includes(name)) {
          return fonts[i + 1];
        }
      }
    }

    function isBoss(tds) {
      let boss;

      for (let td of tds) {
        boss = td.textContent;

        if (boss) {
          if (bosses.includes(boss)) {
            return true;
          }

          break;
        }
      }

      return false;
    }

    function isSlowed(tds) {
      for (let td of tds) {
        if (td.textContent.includes('Slowed')) {
          return true;
        }
      }

      return false;
    }

    function isLink(phrase, links) {
      for (let link of links) {
        if (link.innerHTML.includes(phrase)) {
          return true;
        }
      }

      return false;
    }

    function isCasted(magic, tds) {
      const keyWord = 'Rohane';

      for (let i = tds.length - 1; i > 0; i--) {
        if (tds[i].textContent.includes(magic)) {
          return true;
        }

        if (tds[i].textContent.includes(keyWord)) {
          return false;
        }
      }
    }

    function lookForSlowPotion() {
      const itemTable = getTable('slow');

      if (!itemTable) {
        return false;
      }

      const slowRegex = /(303\d{2})/g;
      let allCodes = [...new Set(itemTable.innerHTML.match(slowRegex))];

      return allCodes[allCodes.length - 1];
    }

    function actorsHealed() {
      let healed = 0;
      let allies = false;
      let imgSrc;

      for (let img of images) {
        imgSrc = img.src.split('/').at(-1);

        if (!allies && imgSrc.includes('donothing')) {
          allies = true;
          continue;
        }

        if (allies) {
          if (imgSrc.includes('exp_') && img.width >= 30) {
            healed += 1;
          }
        }
      }

      return healed;
    }

    /*============================  DOM HELPERS  ============================*/

    function getTable(word) {
      const tables = frame.querySelectorAll('table');

      for (let table of tables) {
        if (table.textContent.includes(word)) {
          return table;
        }
      }

      return null;
    }
  }
})();
