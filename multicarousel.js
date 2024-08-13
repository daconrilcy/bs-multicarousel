import SelectorEngine from "./src/dom/selector-engine.js";
import EventHandler from "./src/dom/event-handler.js";
import Manipulator from "./src/dom/manipulator.js";
import Carousel from "./src/carousel.js";

import {defineJQueryPlugin, reflow} from "./src/util/index.js";
import ResolutionsItemManager from "./resolutionsItemManager.js";


const NAME = 'multi-item-carousel'
const DATA_KEY = 'bs.multi-item-carousel'
const EVENT_KEY = `.${DATA_KEY}`
const DATA_API_KEY = '.data-api'

const ORDER_NEXT = 'next'
const ORDER_PREV = 'prev'

const EVENT_SLIDE = `slide${EVENT_KEY}`
const EVENT_SLID = `slid${EVENT_KEY}`
const EVENT_LOAD_DATA_API = `load${EVENT_KEY}${DATA_API_KEY}`
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`

const CLASS_NAME_CAROUSEL = 'multi-item-carousel'
const CLASS_NAME_ACTIVE = 'active'
const CLASS_NAME_ITEM_TOLEFT = 'item-to-left'
const CLASS_NAME_ITEM_TOLEFT_TRANSITION = 'transitionleft'
const CLASS_NAME_TRANSITION_BACK = 'transitionback'
const CLASS_NAME_TRANSITION_ACCELERATOR_PREDICATION = 'x'
const CLASS_NAME_FIRST_ELEMENT = 'first-element'
const CLASS_NAME_LAST_ELEMENT = 'last-element'

const SELECTOR_DATA_SLIDE = '[data-bs-slide], [data-bs-slide-to]'
const SELECTOR_DATA_RIDE = '[data-bs-ride="multi-item-carousel"]'


class MultiCarousel extends Carousel {
    constructor(element, config) {
        super(element, config);

        if (this._config.ride === CLASS_NAME_CAROUSEL) {
            this.cycle()
        }
        this._resolutionManager = new ResolutionsItemManager();

        this._itemsPerView = 0; // Nombre d'items visibles à la fois
        this._totalItems = 0; // Nombre total d'items
        this._currentIndex = 0;
        this._itemsOrders = [];
        this._initializeCarousel();
        this._addResizeEvent();
    }

    _initializeCarousel() {
        this._totalItems = this._getItems().length;
        this._notEnoughItemsForViewStop();
        this._setItemsOrder();
        this._addDefineFirstLastVisibleItems();
        this._setActivesItems();
    }

    // Static
    static get NAME() {
        return NAME;
    }

    _updateItemsOrders() {
        this._itemsOrders = Array.from(this._getItems()).map(item => parseInt(item.style.order));
    }

    _setItemsOrder(orderList = []) {
        if (orderList.length === 0) {
            orderList = Array.from({length: this._totalItems}, (_, index) => index);
        }
        this._itemsOrders = orderList;
        this._getItems().forEach((item, index) => {
            item.style.order = orderList[index].toString();
        });
    }
    _getOrderItem(element) {
        let order = parseInt(element.style.order);
        if (isNaN(order)) {
            return -1;
        }
        return order;

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

    _setActivesItems(){
        //Order need to be defined first
        this._getItems().forEach(item=>{
            const itemOrder = this._getOrderItem(item)
            if (itemOrder <= this._itemsPerView){
                item.classList.add(CLASS_NAME_ACTIVE)
            }else{
                item.classList.remove(CLASS_NAME_ACTIVE)
            }
        });
    }

    _isEnoughItemsForView() {
        return this._itemsPerView < this._totalItems;
    }

    _toogleSlideButtons(activated=true) {
        const bt_slides = SelectorEngine.find(SELECTOR_DATA_SLIDE, this._element);
        for (const bt_slide of bt_slides) {
            if (activated) {
                bt_slide.classList.remove('disabled');
                bt_slide.classList.remove('d-none');
                bt_slide.removeAttribute('aria-disabled');

            } else {
                bt_slide.classList.add('disabled');
                bt_slide.classList.add('d-none');
                bt_slide.setAttribute('aria-disabled', 'true');
            }
        }

    }

    _onResize() {
        this._initializeCarousel();
        console.log(this._resolutionManager.getScreenResolutionPalier())
    }

    _notEnoughItemsForViewStop() {
        this._setItemPerView();
        if (!this._isEnoughItemsForView()) {
            this._toogleSlideButtons(false);
            this._isSliding = false;
            return true;
        }
        this._toogleSlideButtons(true);
        return false;
    }

    to(index) {
        const items = this._getItems();
        if (index > items.length - 1 || index < 0) {
            return;
        }

        if (this._isSliding) {
            EventHandler.one(this._element, EVENT_SLID, () => this.to(index));
            return;
        }

        if (this._notEnoughItemsForViewStop()) {
            return;
        }

        const activeIndex = this._getFirstActiveIndex();
        if (activeIndex === index) {
            return;
        }

        const totalItems = items.length;
        let stepsForward = (index - activeIndex + totalItems) % totalItems;
        let stepsBackward = (activeIndex - index + totalItems) % totalItems;

        let direction, stepsToMove;

        if (stepsForward <= stepsBackward) {
            direction = ORDER_NEXT;
            stepsToMove = stepsForward;
        } else {
            direction = ORDER_PREV;
            stepsToMove = stepsBackward;
        }

        this._moveSteps(direction, stepsToMove);
    }

    _moveSteps(direction, stepsToMove) {
        const items = this._getItems();
        const totalItems = items.length;
        let currentStep = 0;

        const moveStep = () => {
            if (currentStep >= stepsToMove) {
                this._removeSpeedClasses();
                return;
            }

            const isLastStep = currentStep === stepsToMove - 1;
            const speedClass = isLastStep ? '' : this._defineSpeedClass(stepsToMove - currentStep);

            const nextIndex = direction === ORDER_NEXT
                ? (this._currentIndex + 1) % totalItems
                : (this._currentIndex - 1 + totalItems) % totalItems;

            this._applySpeedClass(speedClass);

            this._slide(direction, items[nextIndex]);

            EventHandler.one(this._element, EVENT_SLID, () => {
                currentStep++;
                setTimeout(moveStep, 50);
            });
        };

        moveStep();
    }

    _defineSpeedClass(stepsToMove=1) {
        let speedClass = '';
        if (stepsToMove > 5) {
            speedClass = `${CLASS_NAME_TRANSITION_ACCELERATOR_PREDICATION}6`;
        } else if (stepsToMove > 1 && stepsToMove <= 5) {
            speedClass = `${CLASS_NAME_TRANSITION_ACCELERATOR_PREDICATION}${stepsToMove}`;
        }
        return speedClass;
    }

    _applySpeedClass(speedClass) {
        const items = this._getItems();
        this._removeSpeedClasses();
        items.forEach(item => {
            if (speedClass) {
                item.classList.add(speedClass);
            }
        });
    }

    _removeSpeedClasses() {
        let classesToRemove = [];
        for (let i = 2; i <= 6; i++) {
            classesToRemove.push(`${CLASS_NAME_TRANSITION_ACCELERATOR_PREDICATION}${i}`);
        }
        const items = this._getItems();
        items.forEach(item => {
            item.classList.remove(...classesToRemove);
        });
    }

    _setNewOrderForItems(isNext) {
        let newItemsOrders = [];
        let order = isNext ? -1 : 1;
        for (let i = 0; i < this._itemsOrders.length; i++) {
            newItemsOrders.push((this._itemsOrders[i] + order + this._totalItems) % this._totalItems);
        }
        this._setItemsOrder(newItemsOrders);
    }

    _getFirstActiveIndex() {
        return this._currentIndex;
    }

    _slide(order, element = null) {
        if (this._isSliding) {
            return;
        }
        if (this._notEnoughItemsForViewStop()) {
            return
        }
        this._isSliding = true;
        this._updateItemsOrders();

        const isNext = order === ORDER_NEXT
        const itemToSlide = isNext ? 1 : -1;
        const newIndex = (this._currentIndex + itemToSlide + this._totalItems) % this._totalItems;
        const nextElement = element || this._getItems()[newIndex];

        this._setActiveIndicatorElement(newIndex)
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
        const transitionClass = isNext ? CLASS_NAME_ITEM_TOLEFT_TRANSITION : CLASS_NAME_TRANSITION_BACK;

        const prepareTransition = () => {
            this._removeFirstLastClass();
            items.forEach(item => {
                item.classList.remove(CLASS_NAME_ITEM_TOLEFT_TRANSITION, CLASS_NAME_TRANSITION_BACK, CLASS_NAME_ITEM_TOLEFT, CLASS_NAME_ACTIVE);
                if (!isNext){
                    item.classList.add(CLASS_NAME_ITEM_TOLEFT);
                }
            });
            reflow(this._element);
        };

        const reorderItems = () => {
            this._setNewOrderForItems(isNext);
            reflow(this._element);
        }

        const startTransition = () => {
            this._updateItemsOrders();
            this._setActivesItems();
            this._getItems().forEach((item ) => {
                item.classList.add(transitionClass);
            });
        };


        const finishTransition = () => {

            items.forEach(item => {
                item.classList.remove(transitionClass, CLASS_NAME_ITEM_TOLEFT);
            });
            if (isNext){
                reorderItems();
            }
            this._setActivesItems();
            this._addDefineFirstLastVisibleItems();
            this._currentIndex = newIndex;
            this._isSliding = false;
            triggerEvent(EVENT_SLID);
        };


        if (!isNext) { reorderItems();}
        prepareTransition();
        startTransition();
        this._queueCallback(finishTransition, this._getItems()[newIndex], this._isAnimated());

    }

    _addResizeEvent() {
        EventHandler.on(window, 'resize', () => this._onResize());
    }

    _addDefineFirstLastVisibleItems() {
        const indexesFistLast = this._defineFirstLastVisibleItems();
        this._addClassFirstLast(indexesFistLast[0], indexesFistLast[1]);
    }

    _defineFirstLastVisibleItems() {
        const maxOrder = this._itemsPerView -1;
        let firstIndex = 0;
        let lastIndex = 0;
        this._getItems().forEach((item,index)=>{
            const OrderIndex = this._getOrderItem(item);
           if (OrderIndex === 0){
                firstIndex = index;
           }
           if (OrderIndex === maxOrder){
               lastIndex = index;
           }
        });
        return [firstIndex, lastIndex];
    }

    _addClassFirstLast(firstIndex, lastIndex) {
        const items = this._getItems();
        if (items.length === 0) {
            return;
        }
        if (firstIndex < 0 || firstIndex >= items.length || lastIndex < 0 || lastIndex >= items.length) {
            return;
        }
        this._removeFirstLastClass();
        items[firstIndex].classList.add(CLASS_NAME_FIRST_ELEMENT);
        items[lastIndex].classList.add(CLASS_NAME_LAST_ELEMENT);
    }
    _removeFirstLastClass() {
        this._getItems().forEach(item => {
            item.classList.remove(CLASS_NAME_FIRST_ELEMENT, CLASS_NAME_LAST_ELEMENT);
        });
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
