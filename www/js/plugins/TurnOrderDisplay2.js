/*:
 * @plugindesc v1.4.0 Visualizador de orden de turnos (para DTB) con estilos
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
 * TurnOrderDisplay.js (Versión 1.4.0)
 * -----------------------------------------------------------------------------
 * Plugin modificado para funcionar con el sistema Default Turn Battle (DTB).
 *
 * v1.4.0:
 * - Se corrigió la lógica de visualización. Ahora el icono del battler
 * permanece visible durante su acción y no desaparece prematuramente.
 * - La lista ahora se basa en el 'subject' (quién actúa) y una copia
 * guardada del orden de turno, en lugar de la lista 'actionBattlers'
 * que se modifica constantemente.
 * - Incluye la corrección v1.3.1 para el bug del color del borde estático.
 * =============================================================================
 */

(function() {
    // Lectura de parámetros (basado en el código del usuario)
    var parameters = PluginManager.parameters('TurnOrderDisplay') || {};
    var PARAM_MAX = Number(parameters['Max Visible'] || 6);
    var PARAM_ICON = Number(parameters['Icon Size'] || 48);
    var PARAM_SPACING = Number(parameters['Spacing'] || 6);
    var PARAM_PAD_X = Number(parameters['Padding X'] || 12);
    var PARAM_PAD_Y = Number(parameters['Padding Y'] || 110); // Valor del usuario
    var PARAM_ANCHOR = String(parameters['Anchor'] || 'top-right');
    var PARAM_ACTOR_FOLDER = String(parameters['Actor Icon Folder'] || 'icon_actors/');
    var PARAM_ENEMY_FOLDER = String(parameters['Enemy Icon Folder'] || 'icon_enemies/');
    var PARAM_BG_COLOR = String(parameters['Background Color'] || '#000000');
    var PARAM_BG_OPACITY = Number(parameters['Background Opacity'] || 128);
    var PARAM_BORDER_THICKNESS = Number(parameters['Border Thickness'] || 3);
    var PARAM_ACTOR_BORDER_COLOR = String(parameters['Actor Border Color'] || '#00FFFF');
    var PARAM_ENEMY_BORDER_COLOR = String(parameters['Enemy Border Color'] || '#FF0000');

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
        this._fullTurnOrder = []; // [NUEVO v1.4.0] Para guardar la lista completa
        
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

    // [NUEVO v1.4.0] Helper para convertir battler a objeto
    Sprite_TurnOrder.prototype.convertBattlerToObject = function(b) {
        if (!b) return null;
        return {
            isActor: b.isActor(),
            actorId: b.isActor() ? b.actorId() : 0,
            enemyId: b.isEnemy() ? b.enemyId() : 0,
            currentSpeed: b.speed(), // Usar speed para la 'firma'
            battler: b,
            isAlive: b.isAlive()
        };
    };

    // [MODIFICADO v1.4.0] La "firma" ahora también depende del 'subject'
    Sprite_TurnOrder.prototype.makeOrderSignature = function() {
        var battlers = this.buildTurnOrder();
        this._battlerOrder = battlers; // Guardar la lista para refreshIcons
        var parts = battlers.map(function(b) {
            if (!b) return 'null';
            var id = (b.isActor ? ('A' + b.actorId) : ('E' + b.enemyId));
            var alive = b.isAlive ? '1' : '0';
            var speed = Math.round(b.currentSpeed || 0);
            return id + ':' + alive + ':' + speed;
        });
        
        // Añadir el 'subject' (quién actúa) a la firma.
        // Si el subject cambia, la firma cambia, y la barra se refresca.
        var subjectId = 'null';
        if (BattleManager._subject && BattleManager._subject.isAlive()) {
             subjectId = (BattleManager._subject.isActor() ? 'A' + BattleManager._subject.actorId() : 'E' + BattleManager._subject.enemyId());
        }
        
        return subjectId + '|' + parts.join('|');
    };

    // [MODIFICADO v1.4.0] Lógica de orden de turnos
    Sprite_TurnOrder.prototype.buildTurnOrder = function() {
        var out = [];
        if (!$gameParty || !$gameTroop || !$gameParty.inBattle()) {
            return out;
        }

        // Get the *currently acting* subject
        var currentSubject = BattleManager._subject;
        // Get the *full* turn order we saved at the start of the turn
        var fullOrder = this._fullTurnOrder || [];
        
        var subjectIndex = -1;
        if (currentSubject && currentSubject.isAlive()) {
            subjectIndex = fullOrder.indexOf(currentSubject);
        }

        // Si el 'subject' (quién actúa) está en nuestra lista guardada...
        if (subjectIndex !== -1) {
            // Añadirlo a él y a todos los que le siguen en la lista
            for (var i = subjectIndex; i < fullOrder.length; i++) {
                var b = fullOrder[i];
                if (b && b.isAlive()) out.push(this.convertBattlerToObject(b));
            }
        } else {
            // Si no hay 'subject' (ej. al inicio o fin del turno), mostramos
            // la lista de "pendientes" como fallback.
            var remaining = BattleManager._actionBattlers || [];
            for (var i = 0; i < remaining.length; i++) {
                 var b = remaining[i];
                 if (b && b.isAlive()) out.push(this.convertBattlerToObject(b));
            }
            // Si "pendientes" está vacío, mostramos la lista completa
            if (out.length === 0) {
                for (var i = 0; i < fullOrder.length; i++) {
                    var b = fullOrder[i];
                    if (b && b.isAlive()) out.push(this.convertBattlerToObject(b));
                }
            }
        }
        
        // Rellenar el resto con simulación (para el siguiente turno)
        if (out.length < this._max) {
            var allLiving = $gameParty.members().concat($gameTroop.members()).filter(function(b) {
                return b && b.isAlive();
            });
            allLiving.sort(function(a, b) { return b.speed() - a.speed(); });

            var simIdx = 0;
            if (allLiving.length > 0) {
                while (out.length < this._max) {
                    var b = allLiving[simIdx % allLiving.length];
                    // Evitar duplicados
                    var isDuplicate = false;
                    for (var k=0; k < out.length; k++) {
                        if (out[k].battler === b) { isDuplicate = true; break; }
                    }
                    if (!isDuplicate) {
                         out.push(this.convertBattlerToObject(b));
                    }
                    simIdx++;
                    if (simIdx > allLiving.length * 2) break; // Safety break
                }
            }
        }

        return out.slice(0, this._max);
    };

    // [MODIFICADO v1.3.1] Corregido bug de color de borde
    Sprite_TurnOrder.prototype.refreshIcons = function() {
        var order = this._battlerOrder;
        for (var i = 0; i < this._icons.length; i++) {
            var s = this._icons[i];
            var data = order[i] || null;

            if (!data) {
                s.bitmap = null;
                s.visible = false;
                if (s._borderSprite) s._borderSprite.bitmap = null;
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
                if (PARAM_BORDER_THICKNESS > 0) {
                    var borderSize = this._iconSize + PARAM_BORDER_THICKNESS * 2;
                    
                    if (!s._borderSprite.bitmap || s._borderSprite.bitmap.width !== borderSize) {
                        s._borderSprite.bitmap = new Bitmap(borderSize, borderSize);
                    } else {
                        s._borderSprite.bitmap.clearRect(0, 0, borderSize, borderSize);
                    }
                    
                    s._borderSprite.bitmap.fillRect(0, 0, borderSize, borderSize, borderColor);
                    s._borderSprite.bitmap.clearRect(
                        PARAM_BORDER_THICKNESS, PARAM_BORDER_THICKNESS,
                        this._iconSize, this._iconSize
                    );
                    
                    s._borderSprite.scale.x = s._borderSprite.scale.y = 1.0;
                } else {
                    s._borderSprite.bitmap = null;
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

            if (s._borderSprite.bitmap) {
                s._borderSprite.opacity = s.opacity;
                s._borderSprite.scale.x = 1 / s.scale.x;
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

    // [MODIFICADO v1.4.0] Hook para 'endAction' (sólo para refrescar)
    var _BM_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        _BM_endAction.call(this);
        if (SceneManager._scene && SceneManager._scene._turnOrderSprite) {
            SceneManager._scene._turnOrderSprite._lastSignature = '';
        }
    };

    // [MODIFICADO v1.4.0] Hook para 'startTurn' (para guardar la lista)
    var _BM_startTurn = BattleManager.startTurn;
    BattleManager.startTurn = function() {
        _BM_startTurn.call(this);
        
        // En este punto, BattleManager._actionBattlers se acaba de crear y ordenar
        if (SceneManager._scene && SceneManager._scene._turnOrderSprite) {
            // Hacemos una COPIA de la lista de battlers
            SceneManager._scene._turnOrderSprite._fullTurnOrder = this._actionBattlers.slice(0);
            // Forzamos un refresco
            SceneManager._scene._turnOrderSprite._lastSignature = '';
        }
    };

    // Hook para 'refresh' (estados, etc.)
    var _GB_refresh = Game_Battler.prototype.refresh;
    Game_Battler.prototype.refresh = function() {
        _GB_refresh.call(this);
        if (SceneManager._scene && SceneManager._scene._turnOrderSprite) {
            SceneManager._scene._turnOrderSprite._lastSignature = '';
        }
    };

})();