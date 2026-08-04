// ==UserScript==
// @name         Neopets: NeoQuest II: Autoplayer
// @namespace    https://github.com/entropia64x/neoquestII/
// @version      3.6
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
  let path = '222222222222877444477711778284482222222633336633333511511115626511111111744444777'; //The path to follow. Works at Level 10.
  let training = 0; //1 = true, 0 = false. Works at Level 10.
  const stop = 0; //1 = true, 0 = false. Works any time.

  const header = document.querySelector('.contentModuleHeader');
  const randomEvent = document.querySelector('.randomEvent');
  if (!header || randomEvent) {
    location.href = 'nq2.phtml';
  } else {
    const frame = document.querySelector('.frame');
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

    const ICON = {
      MAP: 'nav.gif',
      TOMAP: 'tomap.gif',
      BEGIN: 'com_begin.gif',
      ATTACK: 'com_atk.gif',
      NEXT: 'com_next.gif',
      END: 'com_end.gif',
    };

    const ACTOR = {
      ROHANE: 1,
      MIPSY: 2,
      TALINIA: 3,
      VELM: 4,
    };

    for (let i = images.length - 1; i >= 0; i--) {
      switch (images[i].src.split('/').at(-1)) {
        case ICON.MAP:
          mapIcon();
          break;
        case ICON.TOMAP:
          if (GM_getValue('inv')) {
            healBeforeGo();
          } else {
            // Return to map
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
      const pathIndex = GM_getValue('pathIndex', 0);
      let level = readLevel(pathIndex);
      let oldLevel = GM_getValue('oldRohaneLevel', 1);
      let inv = checkHealth();
      //Open Inventory
      if (inv && GM_getValue('hasHealItems', true)) {
        GM_setValue('inv', true);
        go('nq2.phtml?act=inv');
      }
      //Assing skill
      else if (oldLevel < level && level < 40) {
        GM_setValue('oldRohaneLevel', level);
        let skopt = getSkill(level);
        go(
          `nq2.phtml?act=skills&buy_char=1&buy_char=1&confirm=1&skopt_${skopt}=1`
        );
      }
      //Hunting mode
      else if (isHunting(level)) {
        go('nq2.phtml?act=travel&mode=2');
      }
      //Decide path
      else {
        if (pathIndex == 0) {
          path = getPath(level);
          GM_setValue('path', path);
        }
        decidePath(level, pathIndex);
      }
    }

    function readLevel(pathIndex) {
      let table = frame.querySelector('table');
      let level = +table.rows[1].cells[1].textContent;

      if (level == 1 && pathIndex == 0) {
        GM_setValue('oldRohaneLevel', 1);
      }

      return level;
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
        if(link.textContent.match(/Hunting/)) {
          return true;
        }
      }
      return false;
    }

    function getPath(level) {
      if ([7, 9].includes(level)) {
        GM_setValue('first', true);
      }

      const paths = {
        1: '33334444',
        2: '3333344444',
        3: '333333444444',
        4: '3333333344444444',
        5: '333333333331212121244444444444',
        6: '33333333357111111117111112222262222222268444444444',
        7: '33333333357111111117111112222262222222268444444444',
        8: getFirstPath(
          '3333333335711111111711111188288228228888444444744447777777777177744848822666366626622222222662',
          '34'
        ),
        9: '34',
        10: getFirstPath(
          '62222663333333333363333366666622222844444444444444484444888888884444844444482666333',
          training ? '34' : path
        ),
      };

      return paths[level] ?? (training ? '34' : path);
    }

    function getFirstPath(firstPath, otherPath) {
      if (GM_getValue('fisrt', true)) {
        GM_setValue('first', false);
        return firstPath;
      }
      return otherPath;
    }

    function checkHealth() {
      for (let img of images) {
        switch (img.src.split('/').at(-1)) {
          case 'exp_green.gif':
          case 'exp_yellow.gif':
          case 'exp_red.gif':
            //Max 75
            if (img.width <= 45) {
              return true;
            }
        }
      }
      return false;
    }

    function decidePath(level, pathIndex) {
      //Stop
      if (stop) {
        GM_setValue('path', '');
        restartPathIndex();
      }
      //Move
      else if (pathIndex < GM_getValue('path').length) {
        const direction = nextMove(pathIndex);
        GM_setValue('pathIndex', pathIndex + 1);
        go(`nq2.phtml?act=move&dir=${direction}`);
      }
      //Training: move left
      else if (
        training ||
        (level == 8 && !GM_getValue('first')) ||
        level == 9
      ) {
        GM_setValue('pathIndex', 1);
        go('nq2.phtml?act=move&dir=3');
      } else {
        restartPathIndex();
        //Rest with mother
        if (level < 8) {
          go('nq2.phtml?act=talk&targ=10201&say=rest');
        }
        //Finish
        else if ((level > 10 || (level == 10 && !GM_getValue('first'))) && GM_getValue('path', true)) {
          let msg = 'You have arrived at your destination.\n';
          msg += 'Please disable this script to take control.';
          alert(msg);
        }
      }
    }

    function restartPathIndex() {
      GM_setValue('pathIndex', 0);
    }

    function nextMove(pathIndex) {
      return GM_getValue('path')[pathIndex];
    }
    /*=====  INVENTORY  ====*/
    function healBeforeGo() {
      const itemTable = getTable(/Healing/);

      if (!itemTable) {
        GM_setValue('hasHealItems', false);
        go('nq2.phtml');
        return;
      }

      const [lowest, row] = lookForLowestPoints(itemTable);

      if (!lowest) {
        GM_setValue('hasHealItems', false);
        go('nq2.phtml');
      } else {
        let [char, hp] = whoNeedsCure(lowest);

        if (char == -1) {
          GM_setValue('inv', false);
          go('nq2.phtml');
        } else if (!hp) {
          resurrect();
        } else {
          const id = getLowestId(itemTable, row);
          if (id) {
            go(
              `nq2.phtml?act=inv&iact=use&targ_item=${id}&targ_char=${char + 1}`
            );
          } else {
            go('nq2.phtml');
          }
        }
      }
    }

    function getTable(word) {
      const tables = frame.querySelectorAll('table');
      for (let table of tables) {
        if(table.textContent.match(word)) {
          return table;
        }
      }
      return null;
    }

    function lookForLowestPoints(itemTable) {
      let heal_points;
      let lowest;

      for (let i = itemTable.rows.length - 1; i > 0; i--) {
        let str = itemTable.rows[i].cells[2].textContent;
        heal_points = str.match(/heal (\d+)/);

        if (heal_points) {
          GM_setValue('hasHealItems', true);
          return [+heal_points[1], i];
        }
      }

      GM_setValue('hasHealItems', false);
      return [false, false];
    }

    function getLowestId(itemTable, row) {
      let str;
      if (row) {
        str = itemTable.rows[row].cells[3].innerHTML;
        return str.match(/targ_item=(\d+)/)[1];
      }
      return false;
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
      const links = frame.querySelectorAll('a');
      for (let link of links) {
        if (link.href.includes(304)) {
          go(link.href);
          break;
        }
      }
    }

    /*====  BATTLE ====*/
    function battle() {
      let fonts = frame.querySelectorAll('font');
      let [nxactor, font] = whoseTurn(fonts);
      let orange = '#d0d000';

      if (
        font.color == 'red' ||
        (nxactor == ACTOR.MIPSY && font.color == orange)
      ) {
        healOrFlee(nxactor, font);
      } else {
        const actorsActions = {
          1: rohaneAction,
          2: mipsyAction,
          3: taliniaAction,
          4: velmAction,
        };
        actorsActions[nxactor](nxactor, getTarget());
      }
    }

    function whoseTurn(fonts) {
      for (let i = 0; i < fonts.length; i++) {
        switch (fonts[i].innerHTML) {
          case '<b>Rohane</b>':
            return [ACTOR.ROHANE, fonts[i + 1]];
          case '<b>Mipsy</b>':
            return [ACTOR.MIPSY, fonts[i + 1]];
          case '<b>Talinia</b>':
            return [ACTOR.TALINIA, fonts[i + 1]];
          case '<b>Velm</b>':
            return [ACTOR.VELM, fonts[i + 1]];
        }
      }
    }

    function healOrFlee(nxactor, font) {
      let hp$full = font.textContent.match(/(\d+)\/(\d+)/);
      let hp = +hp$full[1];
      let full = +hp$full[2];
      let useid = lookForBestPotion(full - hp);

      if (!useid) {
        let msg = 'Stopped due to lack of potions.\n';
        msg += `Path=${GM_getValue('path')}, pathIndex=${GM_getValue('pathIndex')}`;
        alert(msg);
        GM_setValue('hasHealItems', false);
        GM_setValue('pathIndex', 0);
        GM_setValue('path', '');
        go(`q2.phtml?&fact=${ACTION.FLEE}`);
      } else {
        GM_setValue('hasHealItems', true);
        go(
          `nq2.phtml?&fact=${ACTION.USE_ITEM}&use_id=${useid}&nxactor=${nxactor}`
        );
      }
    }

    function lookForBestPotion(dif) {
      const tds = frame.querySelectorAll('td');
      let allPoints;
      let allCodes;
      let best = false;

      for (let td of tds) {
        allPoints = td.textContent.match(/heal (\d+)/g);
        allCodes = td.innerHTML.match(/(300\d+)/g);
        if (allPoints) {
          for (let i = allPoints.length - 1; i >= 0; i--) {
            points = +allPoints[i].match(/\d+/);
            if (dif >= points || !best) {
              best = allCodes[i].match(/\d+/)[0];
            }
          }
          break;
        }
      }

      return best;
    }

    function getTarget() {
      let chTarget = frame.querySelector('.ch').name;
      let chTarget200 = frame.querySelector('.ch200');
      if (chTarget200) chTarget = chTarget200.name;
      const targets = {
        'ch5': 5,
        'ch6': 6,
        'ch7': 7,
        'ch8':8,
      };
      return(targets[chTarget]);
    }

    function rohaneAction(nxactor, hitTarget) {
      go(
        `nq2.phtml?&fact=${ACTION.ATTACK}&target=${hitTarget}&nxactor=${nxactor}`
      );
    }

    function mipsyAction(nxactor, hitTarget) {
      if (isCasted(/Hasted/)) {
        go(`nq2.phtml?&fact=${ACTION.MIPSY_GROUP_HASTE}`);
      } else {
        go(
          `nq2.phtml?&fact=${ACTION.MIPSY_DIRECT_DAMAGE}&target=${hitTarget}&nxactor=${nxactor}`
        );
      }
    }

    function taliniaAction(nxactor, hitTarget) {
      let multipleTargets = isLink(/Multiple Targets/);
      if (multipleTargets) {
        go(`nq2.phtml?&fact=${ACTION.TALINIA_MULTI}&nxactor={nxactor}`);
      } else {
        go(
          `nq2.phtml?&fact=${ACTION.ATTACK}&target=${hitTarget}&nxactor=${nxactor}`
        );
      }
    }

    function isLink(multipleTargets) {
      const links = frame.querySelectorAll('a');
      for (let link of links) {
        if (link.innerHTML.search(multipleTargets) != -1) {
          return true;
        }
      }
      return false;
    }

    function velmAction(nxactor, hitTarget) {
      let actorsHealed = checkGroupHp();
      if (actorsHealed < 4) {
        go(`nq2.phtml?&fact=${ACTION.VELM_GROUP_HEALING}`);
      } else if (!isCasted(/Def/)) {
        go(`nq2.phtml?&fact=${ACTION.VELM_GROUP_SHIELDING}`);
      } else {
        go(
          `nq2.phtml?&fact=${ACTION.ATTACK}&target=${hitTarget}&nxactor=${nxactor}`
        );
      }
    }

    function isCasted(magic) {
      const tds = frame.querySelectorAll('td');
      const msg = /Messages/;

      for (let i = tds.length - 1; i > 0; i--) {
        if (tds[i].textContent.search(magic) != -1) {
          return true;
        }
        if (tds[i].textContent.search(msg) != -1) {
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
            //45 is full health
            if (img.width >= 30) {
              actorsHealed++;
            }
          }
        }
      }
      return actorsHealed;
    }
  }
})();
