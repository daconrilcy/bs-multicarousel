import Carousel from "./src/carousel.js";
import EventHandler from "./src/dom/event-handler.js";
import SelectorEngine from "./src/dom/selector-engine.js";
import Manipulator from "./src/dom/manipulator.js";
import {defineJQueryPlugin, reflow} from "./src/util/index.js";
import ResolutionManager from "./resolutions.js";

const NAME = 'multi-item-carousel'
const DATA_KEY = 'bs.multi-item-carousel'
const EVENT_KEY = `.${DATA_KEY}`
const DATA_API_KEY = '.data-api'

const ORDER_NEXT = 'next'

const EVENT_SLIDE = `slide${EVENT_KEY}`
const EVENT_SLID = `slid${EVENT_KEY}`
const EVENT_LOAD_DATA_API = `load${EVENT_KEY}${DATA_API_KEY}`
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`

const CLASS_NAME_CAROUSEL = 'multi-item-carousel'
const CLASS_NAME_ACTIVE = 'active'
const CLASS_NAME_ITEM_TOLEFT = 'item-to-left'
const CLASS_NAME_ITEM_TORIGHT = 'item-to-right'
const CLASS_NAME_ITEM_TOLEFT_TRANSITION = 'transitionleft'
const CLASS_NAME_ITEM_TORIGHT_TRANSITION = 'transitionright'

const SELECTOR_DATA_SLIDE = '[data-bs-slide], [data-bs-slide-to]'
const SELECTOR_DATA_RIDE = '[data-bs-ride="multi-item-carousel"]'



class MultiCarousel extends Carousel {
    constructor(element, config) {
        super(element, config);

        if (this._config.ride === CLASS_NAME_CAROUSEL) {
            this.cycle()
        }
        this._resolutionManager = new ResolutionManager();

        this._itemsPerView = 0; // Nombre d'items visibles à la fois
        this._totalItems = 0; // Nombre total d'items
        this._currentIndex = 0;
        this._initializeCarousel();
    }

    _initializeCarousel() {
        this._totalItems = this._getItems().length;
        this._setItemPerView();
        if (this._itemsPerView >= this._totalItems) {
            this._isSliding = false;
        }
        this._getItems().forEach((item, index) => {
            item.style.order = index.toString();
            if (index < this._itemsPerView) {
                item.classList.add(CLASS_NAME_ACTIVE);
            }
        });
    }

    // Static
    static get NAME() {
        return NAME;
    }

    _getNItemFromClass(element) {
        const regex = /^item-(1[0-2]|[1-9])$/;
        return Array.from(element.classList).find(cls => regex.test(cls));
    }

    _hasItemViewClassElement(element) {
        const regex = /^item-(1[0-2]|[1-9])$/;
        return Array.from(element.classList).some(cls => regex.test(cls));
    }

    _setItemPerView() {
        this._itemsPerView = 0;
        for (const item of this._getItems()) {
            if (this._hasItemViewClassElement(item)) {
                this._itemsPerView = this._resolutionManager.getNbItemsPerView(item);
                break;
            }
        }
        if (this._itemsPerView === 0) {
            this._itemsPerView = this._getItems().length;
        }

    }

    _slide(order, element = null) {
        if (this._isSliding) {
            return;
        }
        this._setItemPerView();
        if (this._itemsPerView >= this._totalItems) {
            this._isSliding = false;
            return
        }
        this._isSliding = true;

        const isNext = order === ORDER_NEXT
        const itemToSlide = isNext ? 1 : -1;
        const newIndex = (this._currentIndex + itemToSlide + this._totalItems) % this._totalItems;
        const nextElement = element || this._getItems()[newIndex];
        const triggerEvent = eventName => EventHandler.trigger(this._element, eventName, {
            relatedTarget: nextElement,
            direction: this._orderToDirection(order),
            from: this._currentIndex,
            to: newIndex
        });

        const slideEvent = triggerEvent(EVENT_SLIDE);

        if (slideEvent.defaultPrevented) {
            this._isSliding = false;
            return;
        }

        const items = this._getItems();
        const transitionClass = isNext ? CLASS_NAME_ITEM_TOLEFT_TRANSITION : CLASS_NAME_ITEM_TORIGHT_TRANSITION;
        const temporaryClass = isNext ? CLASS_NAME_ITEM_TORIGHT : CLASS_NAME_ITEM_TOLEFT;

        const prepareTransition = () => {
            items.forEach(item => {
                const itemIndex = this._getItems().indexOf(item);
                const newOrder = (itemIndex - this._currentIndex + this._totalItems) % this._totalItems;
                item.style.order = newOrder.toString();
                item.classList.remove(CLASS_NAME_ITEM_TOLEFT_TRANSITION, CLASS_NAME_ITEM_TORIGHT_TRANSITION, CLASS_NAME_ITEM_TOLEFT, CLASS_NAME_ITEM_TORIGHT);
            });
            reflow(this._element);
        };

        const startTransition = () => {
            items.forEach(item => {
                const itemIndex = this._getItems().indexOf(item);
                const newOrder = (itemIndex - newIndex + this._totalItems) % this._totalItems;
                item.classList.add(transitionClass);

                if (newOrder < this._itemsPerView) {
                    item.classList.add(CLASS_NAME_ACTIVE);
                } else {
                    item.classList.remove(CLASS_NAME_ACTIVE);
                }
            });
        };

        const finishTransition = () => {
            items.forEach(item => {
                item.classList.remove(transitionClass, temporaryClass);
                const itemIndex = this._getItems().indexOf(item);
                const newOrder = (itemIndex - newIndex + this._totalItems) % this._totalItems;
                item.style.order = newOrder.toString();
            });
            this._currentIndex = newIndex;
            this._isSliding = false;
            triggerEvent(EVENT_SLID);
        };

        // Commencer la transition
        prepareTransition();

        if (isNext) {
            startTransition();
            this._queueCallback(finishTransition, items[newIndex], this._isAnimated());
        } else {
            // Préparer les éléments pour la transition 'prev'
            items.forEach(item => item.classList.add(CLASS_NAME_ITEM_TOLEFT));
            reflow(this._element); // Forcer un reflow pour appliquer la classe sans transition

            finishTransition();

            items.forEach(item => {
                item.classList.remove(CLASS_NAME_ITEM_TOLEFT);
                item.classList.add(CLASS_NAME_ITEM_TORIGHT_TRANSITION);
            });

            this._queueCallback(() => {
                items.forEach(item => item.classList.remove(CLASS_NAME_ITEM_TORIGHT_TRANSITION));
                this._isSliding = false;
                triggerEvent(EVENT_SLID);
            }, items[this._currentIndex], this._isAnimated());
        }
    }
}

/**
 * Data API implementation
 */

EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_SLIDE, function (event) {
    const target = SelectorEngine.getElementFromSelector(this)

    if (!target || !target.classList.contains(CLASS_NAME_CAROUSEL)) {
        return
    }

    event.preventDefault()

    const multiCarousel = MultiCarousel.getOrCreateInstance(target)
    const slideIndex = this.getAttribute('data-bs-slide-to')

    if (slideIndex) {
        multiCarousel.to(slideIndex)
        multiCarousel._maybeEnableCycle()
        return
    }

    if (Manipulator.getDataAttribute(this, 'slide') === 'next') {
        multiCarousel.next()
        multiCarousel._maybeEnableCycle()
        return
    }

    multiCarousel.prev()
    multiCarousel._maybeEnableCycle()
})

EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
    const multiCarousels = SelectorEngine.find(SELECTOR_DATA_RIDE)

    for (const multiCarousel of multiCarousels) {
        MultiCarousel.getOrCreateInstance(multiCarousel)
    }
})

/**
 * jQuery
 */

defineJQueryPlugin(MultiCarousel)
export default MultiCarousel;
