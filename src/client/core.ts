import { AppGlobal } from '../util/interfaces';
import { Build } from '../util/build-conditionals';
import { createPlatformClient } from './platform-client';


const App: AppGlobal = (<any>window)[appNamespace] = (<any>window)[appNamespace] || {};

const plt = createPlatformClient(Context, App, window, document, publicPath, hydratedCssClass);

plt.registerComponents(App.components).forEach(cmpMeta => {

  if (Build.es2015) {
    // es6 class extends HTMLElement
    plt.defineComponent(cmpMeta, class HostElement extends HTMLElement {});

  } else if (Build.es5) {
    // es5 way of extending HTMLElement
    function HostElement(self: any) {
      return HTMLElement.call(this, self);
    }

    HostElement.prototype = Object.create(
      HTMLElement.prototype,
      { constructor: { value: HostElement, configurable: true } }
    );

    plt.defineComponent(cmpMeta, HostElement);
  }

});
