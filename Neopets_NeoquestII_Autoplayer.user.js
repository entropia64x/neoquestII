// ==UserScript==
// @name         Neopets: NeoQuest II: Autoplayer
// @namespace    https://github.com/entropia64x/neoquestII/
// @version      3.18
// @description  Remote control and trainer for NeoQuest II
// @author       entropia64x
// @match        https://www.neopets.com/games/nq2/nq2*
// @grant        GM_getValue
// @grant        GM_setValue
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
  let path = ''; //The path to follow. Works at Level 10.
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
      'the miner foreman',
      'Zombom',
      'a giant sand grundo',
      'Ramtor',
      'the Leximp',
      'Kolvars',
      'Scuzzy',
      'Siliclast',
      'Gebarn II',
      'the Revenant',
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

    const ICONS = {
      'nav.gif': mapIcon,
      'tomap.gif': toMap,
      'com_begin.gif': begin,
      'com_atk.gif': battle,
      'com_next.gif': next,
      'com_end.gif': end,
      'cont.gif': toMap,
    };

    /*==============================  MAIN FOR  ==============================*/

    for (let i = images.length - 1; i >= 0; i--) {
      let image = images[i].src.split('/').at(-1);
      let func = ICONS[image];

      if (func) {
        func();

        if (!stop) {
          setTimeout(reloadPage, 10000, image);
        }

        break;
      }
    }

    function reloadPage(image) {
      if (image == 'nav.gif' && GM_getValue('pathIndex') > 0) {
        GM_setValue('pathIndex', GM_getValue('pathIndex') - 1);
      }

      if (image == 'nav.gif' && GM_getValue('pathIndex') == 0) {
        return;
      }

      go();
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
      const level = readLevel();

      if (level >= 8) {
        const inv = whoNeedsCure(GM_getValue('lowest', 15), 'Health')[0];

        if (openInventory(inv)) {
          return;
        }
      }

      if (changeOfLevel(level)) {
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

      return level;
    }

    function changeOfLevel(level) {
      const oldLevel = GM_getValue('oldRohaneLevel', 0);

      if (oldLevel != level) {
        if ([1, 9].includes(level)) {
          GM_setValue('first', true);
        }

        GM_setValue('oldRohaneLevel', level);

        return assignSkill(level);
      }

      return false;
    }

    function assignSkill(level) {
      if (level > 1) {
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
      if (!stop && (level < 10 || training) && isHuntingLinkActive()) {
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

    function getFirstPath(firstPath, otherPath) {
      if (GM_getValue('first')) {
        return firstPath;
      }

      return otherPath;
    }

    function getPath(level) {
      const paths = {
        1: '33334444',
        2: '3333344444',
        3: '33333334444444',
        4: '333333333444444444',
        5: '333333333331212121244444444444',
        6: '33333333357111111117111113434342222262222222268444444444',
        7: '3333333335711111111711111185858585858512222262222222268444444444',
        8: getFirstPath(
          '3333333335711111111711111188288228228888444444744447777777777177744848822666366626622222222662',
          '34'
        ),
        10: getFirstPath(
          '2222663333333333363333366666622222844444444444444484444888888884444844444482666333',
          training ? '34' : path
        ),
      };

      const PATH = paths[level] ?? (training ? '34' : path);

      if ([8, 10].includes(level)) {
        GM_setValue('first', false);
      }

      return PATH;
    }

    /*============================  DECIDE PATH  ============================*/

    function decidePath(level) {
      if (stop) {
        GM_setValue('path', '');
        restartPathIndex();
        return;
      }

      const pathIndex = GM_getValue('pathIndex', 0);

      if (pathIndex == 0) {
        GM_setValue('path', getPath(level));
      }

      path = GM_getValue('path');

      if (pathIndex < path.length) {
        move(path, pathIndex);
        return;
      }

      if ((level == 8 && path == '34') || level == 9) {
        training = 1;
      }

      if (training) {
        moveLeft();
        return;
      }

      restartPathIndex();
      const firstTime = GM_getValue('first', true);

      //Stop
      if ((level > 10 || (level == 10 && !firstTime)) && path) {
        let msg = 'You have arrived at your destination.\n';
        msg += 'Please disable this script to take control.';
        alert(msg);
        return;
      }

      //Rest with mother
      if (level < 8 || (level == 8 && firstTime)) {
        go('?act=talk&targ=10201&say=rest');
        return;
      }

      if (level == 8 && !firstTime) {
        GM_setValue('path', '34');
        moveLeft();
        return;
      }

      if (level == 10 && firstTime) {
        goJS('dosub(6)');
        return;
      }
    }

    function move(path, pathIndex) {
      const direction = path[pathIndex];
      GM_setValue('pathIndex', pathIndex + 1);
      goJS(`dosub(${direction})`);
    }

    function moveLeft() {
      GM_setValue('pathIndex', 1);
      goJS('dosub(3)');
    }

    function restartPathIndex() {
      GM_setValue('pathIndex', 0);
    }

    /*=============================  INVENTORY  =============================*/

    function healBeforeGo() {
      const [item, lowest] = lookForBestPotion(0, 'heal');

      if (item == -1) {
        go();
        return;
      }

      const [char, hp] = whoNeedsCure(lowest, 'Rohane');

      if (!char) {
        GM_setValue('inv', false);
        go();
        return;
      }

      if (!hp) {
        resurrect();
        return;
      }

      go(`?act=inv&iact=use&targ_item=${item}&targ_char=${char}`);
    }

    function whoNeedsCure(lowest, word) {
      const partyTable = findTableByText(word);
      const tds = partyTable.querySelectorAll('td');
      let char = 0;
      let hpArray;
      let current;
      let full;

      for (let td of tds) {
        hpArray = td.textContent.match(/(\d+)\/(\d+)/);

        if (hpArray) {
          char += 1;
          current = +hpArray[1];
          full = +hpArray[2];

          if (full - current > lowest) {
            return [char, current];
          }
        }
      }

      return [0, 0];
    }

    function lookForBestPotion(dif, type) {
      const text = `(${type} `;
      const itemTable = findTableByText(text);

      if (!itemTable) {
        if (type == 'heal') {
          GM_setValue('hasHealItems', false);
        }

        return [-1, 0];
      }

      const potion = POTIONS[type];

      let allPoints = itemTable.textContent.match(potion.regexPoints);
      let points = 0;
      let best = -1;

      for (let i = allPoints.length - 1; i >= 0; i--) {
        points = +allPoints[i].match(/\d+/);

        if (type == 'heal' && i == allPoints.length - 1) {
          GM_setValue('lowest', points);
        }

        if (dif > points || best == -1) {
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
          let url = link.href.split('/').at(-1);
          url = url.replace('nq2.phtml', '');
          go(url);
          break;
        }
      }
    }

    /*===============================  BATTLE ===============================*/

    function battle() {
      const battleState = setBattleState();

      if (battleState.needsHealing && battleState.item != -1) {
        GM_setValue('hasHealItems', true);
      }

      submitAction(battleState);
    }

    function submitAction(battleState) {
      let submit = `settarget(${battleState.target}); `;
      submit += `setaction(${battleState.action}); `;
      submit += `setitem(${battleState.item}); `;
      submit += `setch(ch${battleState.actor}); document.ff.submit();`;
      //alert(JSON.stringify(battleState));
      goJS(submit);
    }

    function needsHealing(nxactor, color) {
      const orange = '#d0d000';

      if (color == 'red' || (nxactor == ACTOR.Mipsy && color == orange)) {
        return true;
      }

      return false;
    }

    function getQuerySelectors() {
      return {
        form: frame.querySelector('FORM'),
        fonts: frame.querySelectorAll('font'),
        links: frame.querySelectorAll('a'),
        tds: frame.querySelectorAll('td'),
      };
    }

    function getBattleInfo(queries) {
      const nxactor = nextActor(queries.form);
      const hpInfo = getHpInfo(nxactor, queries.fonts);
      const textColor = hpInfo.color;

      return {
        actor: nxactor,
        target: getTarget(queries.links),
        action: ACTION.ATTACK,
        item: -1,
        hpInfo,
        needsHealing: needsHealing(nxactor, textColor),
      };
    }

    function addHealingPotion(battleState) {
      const hpArray = battleState.hpInfo.textContent.match(/(\d+)\/(\d+)/);
      const current = +hpArray[1];
      const full = +hpArray[2];
      battleState.item = lookForBestPotion(full - current, 'heal')[0];
    }

    function decideAction(battleState) {
      if (battleState.item != -1) {
        battleState.action = ACTION.USE_ITEM;
      } else if (GM_getValue('oldRohaneLevel') > 2) {
        battleState.action = ACTION.FLEE;
      }
    }

    function setBossState(queries, battleState) {
      const tds1 = queries.tds[0].querySelectorAll('td');
      battleState.isBoss = isBoss(tds1);

      if (battleState.isBoss) {
        battleState.isSlowed = isSlowed(tds1);

        if (!battleState.isSlowed) {
          battleState.item = lookForSlowPotion();
        }

        if (battleState.item == -1 && [ACTOR.Rohane, ACTOR.Velm].includes(battleState.actor)) {
          battleState.item = lookForBestPotion(0, 'dmg')[0];
        }
      }
    }

    function setActorAction(queries, battleState) {
      const actorsActions = {
        [ACTOR.Mipsy]: setMipsyAction,
        [ACTOR.Talinia]: setTaliniaAction,
        [ACTOR.Velm]: setVelmAction,
      };

      actorsActions[battleState.actor](queries, battleState);
    }

    function setBattleState() {
      const queries = getQuerySelectors();
      const battleState = getBattleInfo(queries);

      if (battleState.needsHealing) {
        addHealingPotion(battleState);
        decideAction(battleState);
        return battleState;
      }

      setBossState(queries, battleState);

      if (battleState.item != -1) {
        battleState.action = ACTION.USE_ITEM;
      }

      if (battleState.actor != ACTOR.Rohane) {
        setActorAction(queries, battleState);
      }

      return battleState;
    }

    /*=========================  CHARACTER ACTIONS  =========================*/

    function setMipsyAction(queries, battleState) {
      battleState.action = ACTION.MIPSY_DIRECT_DAMAGE;

      const canHaste = isLink('Group Haste', queries.links);

      if (canHaste) {
        const groupHasted = isCasted('Haste', queries.tds);

        if (!groupHasted) {
          battleState.action = ACTION.MIPSY_GROUP_HASTE;
          return;
        }
      }

      const canShield = isLink('Damage Shields', queries.links);

      if (canShield) {
        const groupShielded = isCasted('Damage Shield', queries.tds);

        if (!groupShielded) {
          battleState.action = ACTION.MIPSY_DAMAGE_SHIELDS;
          return;
        }
      }

      if (battleState.isBoss && !battleState.isSlowed && battleState.item != -1) {
        battleState.action = ACTION.USE_ITEM;
      }
    }

    function setTaliniaAction(queries, battleState) {
      if (battleState.isBoss && !battleState.isSlowed && battleState.item != -1) {
        battleState.action = ACTION.USE_ITEM;
        return;
      }

      if (isLink('Multiple Targets', queries.links)) {
        battleState.action = ACTION.TALINIA_MULTI;
      }
    }

    function setVelmAction(queries, battleState) {
      if (actorsHealed() < 4) {
        battleState.action = ACTION.VELM_GROUP_HEALING;
        return;
      }

      if (!isCasted('Def', queries.tds)) {
        battleState.action = ACTION.VELM_GROUP_SHIELDING;
      }
    }

    /*==========================  BATTLE QUERIES  ===========================*/

    function nextActor(form) {
      for (let i = form.length - 1; i >= 0; i--) {
        if (form[i].name == 'nxactor') {
          return +form[i].value;
        }
      }

      return false;
    }

    function getTarget(links) {
      for (let link of links) {
        let match = link.onclick?.toString().match(/settarget\((\d+)\)/);

        if (match) {
          return +match[1];
        }
      }

      return 5;
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

      return null;
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

      for (let i = tds.length - 1; i >= 0; i--) {
        if (tds[i].textContent.includes(magic)) {
          return true;
        }

        if (tds[i].textContent.includes(keyWord)) {
          return false;
        }
      }

      return false;
    }

    function lookForSlowPotion() {
      const itemTable = findTableByText('(slow ');

      if (!itemTable) {
        return -1;
      }

      const slowRegex = /(303\d{2})/g;
      let allCodes = [...new Set(itemTable.innerHTML.match(slowRegex))];

      return allCodes[allCodes.length - 1];
    }

    function actorsHealed() {
      let healed = 0;
      let allies = false;
      let imgSrc;
      const maxHealth = 45;

      for (let img of images) {
        imgSrc = img.src.split('/').at(-1);

        if (!allies && imgSrc.includes('donothing')) {
          allies = true;
          continue;
        }

        if (allies) {
          if (imgSrc.includes('exp_green') && img.width >= (2 / 3) * maxHealth) {
            healed += 1;
          }
        }
      }

      return healed;
    }

    /*============================  DOM HELPERS  ============================*/

    function findTableByText(word) {
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
