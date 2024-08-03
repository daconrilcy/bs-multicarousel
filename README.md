# MultiCarousel Plugin for Bootstrap

## Description
The `MultiCarousel` class allows you to manage a Bootstrap carousel that displays multiple slides at once on a single page.

## Installation
1. **SCSS Files**
   - Add the `_variables.scss` and `_multicarousel.scss` files to your stylesheets directory.
   - Ensure to compile these SCSS files to CSS as part of your build process.

2. **JavaScript Files**
   - Add `resolutions.js` and `multicarousel.js` to the same directory.
   - Download the full and detailed version of Bootstrap's JavaScript.
   - The configuration of `multicarousel.js` assumes that Bootstrap's source files are in a `src` subdirectory within the directory where you've copied Bootstrap's JavaScript source files.
   - Modify the imports in `multicarousel.js` as needed based on your setup.

## Usage
Construction is similar to the usual Bootstrap Carousel with a few key differences:

1. The class for the main `div` is `multi-item-carousel` instead of `carousel`.
2. The data-ride attribut for the main must contain `multi-item-carouse` instead of `carousel`.
3. The inner `div` must contain the class `multi-item-carousel-inner`.
4. Each `carousel-item` must include additional classes such as `item-md-4` or `item-lg-3`. These classes determine the number of items shown simultaneously by the carousel. They function similarly to Bootstrap's `col` classes, using a 12-column grid system that adapts to different screen resolutions.

All original Bootstrap Carousel functionalities are also valid for MultiCarousel: API calls, mouse and keyboard interactions, touch screens, swipe, auto slide, etc.

## Example
```html
<div id="myMultiCarousel" class="carousel slide multi-item-carousel" data-ride="multi-item-carousel">
  <div class="multi-item-carousel-inner">
    <div class="carousel-item active item-md-4">
      <!-- Your content here -->
    </div>
    <div class="carousel-item item-md-4">
      <!-- Your content here -->
    </div>
    <div class="carousel-item item-md-4">
      <!-- Your content here -->
    </div>
    <!-- Additional carousel items -->
  </div>
  <!-- Controls -->
  <a class="carousel-control-prev" href="#myMultiCarousel" role="button" data-slide="prev">
    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
    <span class="sr-only">Previous</span>
  </a>
  <a class="carousel-control-next" href="#myMultiCarousel" role="button" data-slide="next">
    <span class="carousel-control-next-icon" aria-hidden="true"></span>
    <span class="sr-only">Next</span>
  </a>
</div>
```
## Notes
You can vary the number of items displayed simultaneously from 1 to 12 depending on the display classes used for the carousel items. However, ensure to use the same class for each item to avoid display issues.
The number of items displayed can differ based on screen resolution as specified by the classes.
Ensure to include the necessary Bootstrap CSS and JS files in your project and customize the classes as needed to fit your design requirements. By following these guidelines, you can create a responsive carousel that displays multiple items effectively.
