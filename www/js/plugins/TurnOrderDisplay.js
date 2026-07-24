/*:
 * @plugindesc v1.3.1 Visualizador de orden de turnos (para DTB) con estilos
 * @author Luics Enrique 
 *
 * @param Max Visible
 * @type number
 * @min 1
 * @default 8
 * @desc Número máximo de iconos a mostrar en la barra.
 *
 * @param Icon Size
 * @type number
 * @min 16
 * @default 48
 * @desc Tamaño (px) al que se ajustará cada sprite (se escala según imagen original).
 *
 * @param Spacing
 * @type number
 * @min 0
 * @default 6
 * @desc Espacio en píxeles entre iconos.
 *
 * @param Padding X
 * @type number
 * @min 0
 * @default 12
 * @desc Distancia desde el borde derecho de la pantalla.
 *
 * @param Padding Y
 * @type number
 * @min 0
 * @default 10
 * @desc Distancia desde el borde superior de la pantalla.
 *
 * @param Anchor
 * @type select
 * @option top-right
 * @option top-left
 * @option bottom-right
 * @option bottom-left
 * @default top-right
 * @desc Esquina donde se colocará la barra. Por defecto: esquina superior derecha.
 *
 * @param Actor Icon Folder
 * @type string
 * @default icon_actors/
 * @desc Carpeta en img/ donde están los iconos de actores. (Ej: icon_actors/)
 *
 * @param Enemy Icon Folder
 * @type string
 * @default icon_enemies/
 * @desc Carpeta en img/ donde están los iconos de enemigos. (Ej: icon_enemies/)
 *
 * @param Background Color
 * @type string
 * @default #000000
 * @desc Color del fondo de la barra de turnos (formato Hex #RRGGBB).
 *
 * @param Background Opacity
 * @type number
 * @min 0
 * @max 255
 * @default 128
 * @desc Opacidad del fondo de la barra (0-255).
 *
 * @param Border Thickness
 * @type number
 * @min 0
 * @default 2
 * @desc Grosor del borde de cada icono. 0 para sin borde.
 *
 * @param Actor Border Color
 * @type string
 * @default #00FFFF
 * @desc Color del borde para iconos de actores (formato Hex #RRGGBB).
 *
 * @param Enemy Border Color
 * @type string
 * @default #FF0000
 * @desc Color del borde para iconos de enemigos (formato Hex #RRGGBB).
 *
 * @help
 * =============================================================================
 * TurnOrderDisplay.js (Versión 1.3.1)
 * -----------------------------------------------------------------------------
 * Plugin modificado para funcionar con el sistema Default Turn Battle (DTB).
 *
 * v1.3.1:
 * - Corregido el bug que causaba que el borde no actualizara su color
 * (ej. se quedaba azul cuando el turno pasaba a un enemigo).
 * v1.3.0:
 * - Implementados bordes de color para actores/enemigos y un fondo para la barra.
 * v1.2.1:
 * - Corregido el crasheo 'BattleManager.isInBattle is not a function'.
 * =============================================================================
 */

(function() {
    var parameters = PluginManager.parameters('TurnOrderDisplay') || {};
    var PARAM_MAX = Number(parameters['Max Visible'] || 6);
    var PARAM_ICON = Number(parameters['Icon Size'] || 48);
    var PARAM_SPACING = Number(parameters['Spacing'] || 6);
    var PARAM_PAD_X = Number(parameters['Padding X'] || 12);
    var PARAM_PAD_Y = Number(parameters['Padding Y'] || 110);
    var PARAM_ANCHOR = String(parameters['Anchor'] || 'top-right');
    var PARAM_ACTOR_FOLDER = String(parameters['Actor Icon Folder'] || 'icon_actors/');
    var PARAM_ENEMY_FOLDER = String(parameters['Enemy Icon Folder'] || 'icon_enemies/');
    
    // [NUEVO] Parámetros de estilo
    var PARAM_BG_COLOR = String(parameters['Background Color'] || '#000000');
    var PARAM_BG_OPACITY = Number(parameters['Background Opacity'] || 128);
    var PARAM_BORDER_THICKNESS = Number(parameters['Border Thickness'] || 2);
    var PARAM_ACTOR_BORDER_COLOR = String(parameters['Actor Border Color'] || '#00FFFF');
    var PARAM_ENEMY_BORDER_COLOR = String(parameters['Enemy Border Color'] || '#FF0000');

    // Asegurarse de que las carpetas terminen con /
    if (PARAM_ACTOR_FOLDER.length > 0 && !PARAM_ACTOR_FOLDER.endsWith('/')) {
        PARAM_ACTOR_FOLDER += '/';
    }
    if (PARAM_ENEMY_FOLDER.length > 0 && !PARAM_ENEMY_FOLDER.endsWith('/')) {
        PARAM_ENEMY_FOLDER += '/';
    }

    // ---------------------------------------------------------------------
    // Sprite_TurnOrder
    // ---------------------------------------------------------------------
    function Sprite_TurnOrder() {
        this.initialize.apply(this, arguments);
    }

    Sprite_TurnOrder.prototype = Object.create(Sprite.prototype);
    Sprite_TurnOrder.prototype.constructor = Sprite_TurnOrder;

    Sprite_TurnOrder.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._max = PARAM_MAX;
        this._iconSize = PARAM_ICON;
        this._spacing = PARAM_SPACING;
        this._paddingX = PARAM_PAD_X;
        this._paddingY = PARAM_PAD_Y;
        this._anchor = PARAM_ANCHOR;
        this._battlerOrder = [];
        this._lastSignature = '';
        this._icons = [];
        
        this._backgroundSprite = new Sprite(new Bitmap(1,1));
        this._backgroundSprite.opacity = PARAM_BG_OPACITY;
        this.addChild(this._backgroundSprite);

        this._container = new Sprite();
        this.addChild(this._container);
        this.createIcons(this._max);
        this.visible = true;
        this.updatePosition();
    };

    Sprite_TurnOrder.prototype.createIcons = function(n) {
        for (var i = 0; i < n; i++) {
            var s = new Sprite();
            s.anchor.x = 0.5;
            s.anchor.y = 0.5;
            s.x = 0; s.y = 0;
            s.scale.x = 1.0; s.scale.y = 1.0;
            s._baseScale = 1.0;
            s._borderSprite = new Sprite(new Bitmap(2,2));
            s._borderSprite.anchor.x = 0.5;
            s._borderSprite.anchor.y = 0.5;
            s.addChild(s._borderSprite);
            this._container.addChild(s);
            this._icons.push(s);
        }
    };

    Sprite_TurnOrder.prototype.updatePosition = function() {
        var iconAndSpacingWidth = this._iconSize + this._spacing;
        var totalWidth = this._max * iconAndSpacingWidth - this._spacing;
        if (this._max === 0) totalWidth = 0;
        
        var bgWidth = totalWidth + (PARAM_BORDER_THICKNESS * 2) + 10;
        var bgHeight = this._iconSize + (PARAM_BORDER_THICKNESS * 2) + 10;
        
        var gw = Graphics.boxWidth;
        var gh = Graphics.boxHeight;
        var x = 0, y = 0;
        
        switch (this._anchor) {
            case 'top-right': 
                x = gw - this._paddingX - totalWidth / 2;
                y = this._paddingY + this._iconSize / 2;
                break;
            case 'top-left': 
                x = this._paddingX + totalWidth / 2;
                y = this._paddingY + this._iconSize / 2;
                break;
            case 'bottom-right': 
                x = gw - this._paddingX - totalWidth / 2;
                y = gh - this._paddingY - this._iconSize / 2;
                break;
            case 'bottom-left': 
                x = this._paddingX + totalWidth / 2;
                y = gh - this._paddingY - this._iconSize / 2;
                break;
            default: 
                x = gw - this._paddingX - totalWidth / 2;
                y = this._paddingY + this._iconSize / 2;
                break;
        }
        this.x = x;
        this.y = y;

        if (this._backgroundSprite.bitmap.width !== bgWidth || this._backgroundSprite.bitmap.height !== bgHeight) {
            this._backgroundSprite.bitmap = new Bitmap(bgWidth, bgHeight);
            this._backgroundSprite.bitmap.fillRect(0, 0, bgWidth, bgHeight, PARAM_BG_COLOR);
            this._backgroundSprite.anchor.x = 0.5;
            this._backgroundSprite.anchor.y = 0.5;
        }

        for (var i = 0; i < this._icons.length; i++) {
            var sx = -totalWidth/2 + this._iconSize/2 + i * (this._iconSize + this._spacing);
            this._icons[i].x = Math.round(sx);
            this._icons[i].y = 0;
        }
    };

    Sprite_TurnOrder.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!(SceneManager._scene instanceof Scene_Battle)) return;
        this.updatePosition();
        var order = this.makeOrderSignature();
        if (order !== this._lastSignature) {
            this._lastSignature = order;
            this.refreshIcons();
        }
        this.updateIconsEffects();
    };

    Sprite_TurnOrder.prototype.makeOrderSignature = function() {
        var battlers = this.buildTurnOrder();
        this._battlerOrder = battlers;
        var parts = battlers.map(function(b) {
            if (!b) return 'null';
            var id = (b.isActor ? ('A' + b.actorId) : ('E' + b.enemyId));
            var alive = b.isAlive ? '1' : '0';
            var speed = Math.round(b.currentSpeed || 0);
            return id + ':' + alive + ':' + speed;
        });
        return parts.join('|');
    };

    Sprite_TurnOrder.prototype.buildTurnOrder = function() {
        var out = [];
        if (!$gameParty || !$gameTroop || !$gameParty.inBattle()) {
            return out;
        }

        var currentTurnBattlers = BattleManager._actionBattlers || [];
        for (var i = 0; i < currentTurnBattlers.length; i++) {
            var b = currentTurnBattlers[i];
            if (!b || !b.isAlive()) continue;
            out.push({
                isActor: b.isActor(),
                actorId: b.isActor() ? b.actorId() : 0,
                enemyId: b.isEnemy() ? b.enemyId() : 0,
                currentSpeed: b.speed(),
                battler: b,
                isAlive: true
            });
        }

        if (out.length < this._max) {
            var allLivingBattlers = [];
            var actors = $gameParty.members();
            var enemies = $gameTroop.members();
            for (var i = 0; i < actors.length; i++) {
                if (actors[i] && actors[i].isAlive()) allLivingBattlers.push(actors[i]);
            }
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j] && enemies[j].isAlive()) allLivingBattlers.push(enemies[j]);
            }

            allLivingBattlers.sort(function(a, b) {
                return b.speed() - a.speed();
            });

            var idx = 0;
            if (allLivingBattlers.length > 0) {
                while (out.length < this._max) {
                    var b = allLivingBattlers[idx % allLivingBattlers.length];
                    out.push({
                        isActor: b.isActor(),
                        actorId: b.isActor() ? b.actorId() : 0,
                        enemyId: b.isEnemy() ? b.enemyId() : 0,
                        currentSpeed: b.speed(),
                        battler: b,
                        isAlive: true
                    });
                    idx++;
                }
            }
        }

        return out.slice(0, this._max);
    };

    // [MODIFICADO] refreshIcons para corregir bug de color de borde
    Sprite_TurnOrder.prototype.refreshIcons = function() {
        var order = this._battlerOrder;
        for (var i = 0; i < this._icons.length; i++) {
            var s = this._icons[i];
            var data = order[i] || null;

            if (!data) {
                s.bitmap = null;
                s.visible = false;
                if (s._borderSprite) s._borderSprite.bitmap = null; // Ocultar borde también
                continue;
            }
            s.visible = true;
            
            var filename = null;
            var folder = '';
            var bmp = null;
            var borderColor = '';

            if (data.isActor) {
                var actor = $dataActors[data.actorId];
                if (!actor) { s.visible = false; if (s._borderSprite) s._borderSprite.bitmap = null; continue; }
                folder = 'img/' + PARAM_ACTOR_FOLDER;
                filename = actor.name;
                borderColor = PARAM_ACTOR_BORDER_COLOR;
            } else {
                var enemy = $dataEnemies[data.enemyId];
                if (!enemy) { s.visible = false; if (s._borderSprite) s._borderSprite.bitmap = null; continue; }
                folder = 'img/' + PARAM_ENEMY_FOLDER;
                filename = enemy.name;
                borderColor = PARAM_ENEMY_BORDER_COLOR;
            }
            
            if (filename) {
                bmp = ImageManager.loadBitmap(folder, filename, 0, true);
            } else {
                bmp = null;
            }
            
            s.bitmap = bmp;
            
            if (s.bitmap && s.bitmap.isReady()) {
                var w = s.bitmap.width;
                var h = s.bitmap.height;
                var scale = Math.min(this._iconSize / w, this._iconSize / h);
                s.scale.x = s.scale.y = scale;
                s._baseScale = scale;

                // [INICIO DE CORRECCIÓN v1.3.1]
                // Dibujar el borde
                if (PARAM_BORDER_THICKNESS > 0) {
                    var borderSize = this._iconSize + PARAM_BORDER_THICKNESS * 2;
                    
                    // Forzar la creación/limpieza del bitmap para actualizar el color
                    if (!s._borderSprite.bitmap || s._borderSprite.bitmap.width !== borderSize) {
                        s._borderSprite.bitmap = new Bitmap(borderSize, borderSize);
                    } else {
                        s._borderSprite.bitmap.clearRect(0, 0, borderSize, borderSize); // Limpiar
                    }
                    
                    // Dibujar siempre el borde con el color correcto
                    s._borderSprite.bitmap.fillRect(0, 0, borderSize, borderSize, borderColor);
                    s._borderSprite.bitmap.clearRect(
                        PARAM_BORDER_THICKNESS, PARAM_BORDER_THICKNESS,
                        this._iconSize, this._iconSize
                    );
                    
                    s._borderSprite.scale.x = s._borderSprite.scale.y = 1.0;
                } else {
                    s._borderSprite.bitmap = null; // Sin borde
                }
                // [FIN DE CORRECCIÓN v1.3.1]

            } else {
                s.scale.x = s.scale.y = 1.0;
                s._baseScale = 1.0;
                if (s._borderSprite) s._borderSprite.bitmap = null;
            }
            s._battlerData = data;
        }
    };

    Sprite_TurnOrder.prototype.updateIconsEffects = function() {
        for (var i = 0; i < this._icons.length; i++) {
            var s = this._icons[i];
            if (!s.visible) continue;

            if (s.bitmap && s.bitmap.isReady() && s._baseScale === 1.0) {
                 var w = s.bitmap.width;
                 var h = s.bitmap.height;
                 s._baseScale = Math.min(this._iconSize / w, this._iconSize / h);
                 if (i !== 0) s.scale.x = s.scale.y = s._baseScale;
            }
            
            // Efectos de escala y opacidad
            if (i === 0) {
                var targetScale = s._baseScale * 1.15;
                s.scale.x += (targetScale - s.scale.x) * 0.12;
                s.scale.y = s.scale.x;
                s.opacity += (255 - s.opacity) * 0.12;
            } else {
                var targetScale = s._baseScale;
                s.scale.x += (targetScale - s.scale.x) * 0.12;
                s.scale.y = s.scale.x;
                s.opacity += (180 - s.opacity) * 0.08;
            }

            // El borde acompaña al icono pero no se escala con el efecto de "activo"
            if (s._borderSprite.bitmap) {
                s._borderSprite.opacity = s.opacity;
                s._borderSprite.scale.x = 1 / s.scale.x; // Compensar la escala del padre
                s._borderSprite.scale.y = 1 / s.scale.y;
            }
        }
    };

    // ---------------------------------------------------------------------
    // Hooks (Ganchos) para la escena de batalla
    // ---------------------------------------------------------------------
    var _S_B_createSpriteset = Scene_Battle.prototype.createSpriteset;
    Scene_Battle.prototype.createSpriteset = function() {
        _S_B_createSpriteset.call(this);
        if (!this._turnOrderSprite) {
            this._turnOrderSprite = new Sprite_TurnOrder();
            this.addChild(this._turnOrderSprite);
        }
    };

    var _S_B_terminate = Scene_Battle.prototype.terminate;
    Scene_Battle.prototype.terminate = function() {
        if (this._turnOrderSprite) {
            if (this._turnOrderSprite.parent) this._turnOrderSprite.parent.removeChild(this._turnOrderSprite);
            this._turnOrderSprite = null;
        }
        _S_B_terminate.call(this);
    };

    var _BM_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        _BM_endAction.call(this);
        if (SceneManager._scene && SceneManager._scene._turnOrderSprite) {
            SceneManager._scene._turnOrderSprite._lastSignature = '';
        }
    };

    var _BM_startTurn = BattleManager.startTurn;
    BattleManager.startTurn = function() {
        _BM_startTurn.call(this);
        if (SceneManager._scene && SceneManager._scene._turnOrderSprite) {
            SceneManager._scene._turnOrderSprite._lastSignature = '';
        }
    };

    var _GB_refresh = Game_Battler.prototype.refresh;
    Game_Battler.prototype.refresh = function() {
        _GB_refresh.call(this);
        if (SceneManager._scene && SceneManager._scene._turnOrderSprite) {
            SceneManager._scene._turnOrderSprite._lastSignature = '';
        }
    };

})();