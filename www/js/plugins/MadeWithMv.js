/*:
 * NOTE: Images are stored in the img/system folder.
 *
 * @plugindesc Show a Splash Screen "Made with MV" and then a second splash: DerechosAutor.png before the title screen.
 * @author Luics Enrique
 *
 * @help This plugin does not provide plugin commands.
 *
 * @param Show Made With MV
 * @desc Enabled/Disables showing the "Made with MV" splash screen.
 * OFF - false     ON - true
 * Default: ON
 * @default true
 *
 * @param Made with MV Image
 * @desc The image to use when showing "Made with MV"
 * Default: MadeWithMv
 * @default MadeWithMv
 * @require 1
 * @dir img/system/
 * @type file
 *
 * @param Fade Out Time
 * @desc The time it takes to fade out, in frames.
 * Default: 120
 * @default 120
 *
 * @param Fade In Time
 * @desc The time it takes to fade in, in frames.
 * Default: 120
 * @default 120
 *
 * @param Wait Time
 * @desc The time between fading in and out for MadeWithMV, in frames.
 * Default: 160
 * @default 160
 */

var Liquidize = Liquidize || {};
Liquidize.MadeWithMV = {};
Liquidize.MadeWithMV.Parameters = PluginManager.parameters('MadeWithMv');

Liquidize.MadeWithMV.ShowMV = JSON.parse(Liquidize.MadeWithMV.Parameters["Show Made With MV"]);
Liquidize.MadeWithMV.MVImage = String(Liquidize.MadeWithMV.Parameters["Made with MV Image"]);
Liquidize.MadeWithMV.FadeOutTime = Number(Liquidize.MadeWithMV.Parameters["Fade Out Time"]) || 120;
Liquidize.MadeWithMV.FadeInTime = Number(Liquidize.MadeWithMV.Parameters["Fade In Time"]) || 120;
Liquidize.MadeWithMV.WaitTime = Number(Liquidize.MadeWithMV.Parameters["Wait Time"]) || 160;


// -----------------------------------------------------------------------------
// NEW FIXED AUTHOR SPLASH
// -----------------------------------------------------------------------------
Liquidize.MadeWithMV.AuthorImage = "DerechosAutor";
Liquidize.MadeWithMV.AuthorWait = 210; // 3.5 segundos


// -----------------------------------------------------------------------------
// Scene_Splash (original del plugin)
// -----------------------------------------------------------------------------

function Scene_Splash() {
    this.initialize.apply(this, arguments);
}

(function() {

    // -------------------------------------------------------------------------
    // Scene_Boot override
    // -------------------------------------------------------------------------

    var _Scene_Boot_loadSystemImages = Scene_Boot.prototype.loadSystemImages;
    Scene_Boot.prototype.loadSystemImages = function() {
        _Scene_Boot_loadSystemImages.call(this);
        if (Liquidize.MadeWithMV.ShowMV) {
            ImageManager.loadSystem(Liquidize.MadeWithMV.MVImage);
        }

        // Load fixed Author image
        ImageManager.loadSystem(Liquidize.MadeWithMV.AuthorImage);
    };

    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        if (Liquidize.MadeWithMV.ShowMV && !DataManager.isBattleTest() && !DataManager.isEventTest()) {
            SceneManager.goto(Scene_Splash);
        } else {
            _Scene_Boot_start.call(this);
        }
    };

    // -------------------------------------------------------------------------
    // Scene_Splash
    // -------------------------------------------------------------------------

    Scene_Splash.prototype =
        Object.create(Scene_Base.prototype);
    Scene_Splash.prototype.constructor = Scene_Splash;

    Scene_Splash.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);

        this._mvSplash = null;
        this._mvWaitTime = Liquidize.MadeWithMV.WaitTime;
        this._mvFadeOut = false;
        this._mvFadeIn = false;

        // NEW AUTHOR SPLASH
        this._authorSplash = null;
        this._authorFadeIn = false;
        this._authorFadeOut = false;
        this._authorWait = Liquidize.MadeWithMV.AuthorWait;
    };

    Scene_Splash.prototype.create = function() {
        Scene_Base.prototype.create.call(this);

        // -- Splash MadeWithMV --
        if (Liquidize.MadeWithMV.ShowMV) {
            this._mvSplash = new Sprite(ImageManager.loadSystem(Liquidize.MadeWithMV.MVImage));
            this.addChild(this._mvSplash);
        }

        // -- Nueva Splash Autor --
        this._authorSplash = new Sprite(ImageManager.loadSystem(Liquidize.MadeWithMV.AuthorImage));
        this._authorSplash.opacity = 0;
        this.addChild(this._authorSplash);
    };

    Scene_Splash.prototype.start = function() {
        Scene_Base.prototype.start.call(this);
        SceneManager.clearStack();

        if (this._mvSplash) this.centerSprite(this._mvSplash);
        if (this._authorSplash) this.centerSprite(this._authorSplash);
    };

    Scene_Splash.prototype.update = function() {

        // -----------------------------
        // 1) MADE WITH MV
        // -----------------------------
        if (Liquidize.MadeWithMV.ShowMV) {

            if (!this._mvFadeIn) {
                this.startFadeIn(Liquidize.MadeWithMV.FadeInTime, false);
                this._mvFadeIn = true;

            } else {
                if (this._mvWaitTime > 0 && !this._mvFadeOut) {
                    this._mvWaitTime--;

                } else if (!this._mvFadeOut) {
                    this._mvFadeOut = true;
                    this.startFadeOut(Liquidize.MadeWithMV.FadeOutTime, false);
                }
            }

            // Si aún estamos en MV, no continuar
            if (!this._mvFadeOut || this._fadeDuration > 0) {
                Scene_Base.prototype.update.call(this);
                return;
            }
        }

        // -----------------------------
        // 2) AUTOR (nueva splash)
        // -----------------------------
        if (!this._authorFadeIn) {

            if (this._fadeDuration === 0) {
                this._authorSplash.opacity = 255;
                this.startFadeIn(Liquidize.MadeWithMV.FadeInTime, false);
                this._authorFadeIn = true;
            }

        } else {
            if (this._authorWait > 0 && !this._authorFadeOut) {
                this._authorWait--;

            } else if (!this._authorFadeOut) {
                this._authorFadeOut = true;
                this.startFadeOut(Liquidize.MadeWithMV.FadeOutTime, false);
            }
        }

        // Si terminó → continuar al título
        if (this._authorFadeOut && this._fadeDuration === 0) {
            this.gotoTitleOrTest();
        }

        Scene_Base.prototype.update.call(this);
    };

    // -------------------------------------------------------------------------

    Scene_Splash.prototype.centerSprite = function(sprite) {
        sprite.x = Graphics.width / 2;
        sprite.y = Graphics.height / 2;
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
    };

    Scene_Splash.prototype.gotoTitleOrTest = function() {
        Scene_Base.prototype.start.call(this);
        SoundManager.preloadImportantSounds();

        if (DataManager.isBattleTest()) {
            DataManager.setupBattleTest();
            SceneManager.goto(Scene_Battle);
        } 
        else if (DataManager.isEventTest()) {
            DataManager.setupEventTest();
            SceneManager.goto(Scene_Map);
        } 
        else {
            this.checkPlayerLocation();
            DataManager.setupNewGame();
            SceneManager.goto(Scene_Title);
            Window_TitleCommand.initCommandPosition();
        }

        this.updateDocumentTitle();
    };

    Scene_Splash.prototype.updateDocumentTitle = function() {
        document.title = $dataSystem.gameTitle;
    };

    Scene_Splash.prototype.checkPlayerLocation = function() {
        if ($dataSystem.startMapId === 0) {
            throw new Error("Player's starting position is not set");
        }
    };

})();
