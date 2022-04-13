
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.47.0 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (251:0) {:else}
    function create_else_block$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Server.svelte generated by Svelte v3.47.0 */

    const file$3 = "src\\components\\Server.svelte";

    function create_fragment$4(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*server*/ ctx[0].hostname + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*server*/ ctx[0].server_type + "";
    	let t2;
    	let t3;
    	let td2;
    	let i;
    	let i_title_value;
    	let t4;
    	let td3;
    	let t5_value = /*server*/ ctx[0].cpu + "";
    	let t5;
    	let t6;
    	let td4;
    	let t7_value = /*server*/ ctx[0].ram + "";
    	let t7;
    	let small0;
    	let t8_value = /*server*/ ctx[0].ram_type + "";
    	let t8;
    	let t9;
    	let td5;
    	let t10_value = /*server*/ ctx[0].disk + "";
    	let t10;
    	let small1;
    	let t11_value = /*server*/ ctx[0].disk_type + "";
    	let t11;
    	let t12;
    	let td6;
    	let t13_value = /*server*/ ctx[0].location_id + "";
    	let t13;
    	let t14;
    	let td7;
    	let t15_value = /*server*/ ctx[0].provider_id + "";
    	let t15;
    	let t16;
    	let td8;
    	let t17_value = /*server*/ ctx[0].price + "";
    	let t17;
    	let t18;
    	let t19_value = /*server*/ ctx[0].currency + "";
    	let t19;
    	let t20;
    	let t21_value = /*terms*/ ctx[1][/*server*/ ctx[0].payment_term] + "";
    	let t21;
    	let t22;
    	let td9;
    	let t23_value = /*server*/ ctx[0].owned_since + "";
    	let t23;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			i = element("i");
    			t4 = space();
    			td3 = element("td");
    			t5 = text(t5_value);
    			t6 = space();
    			td4 = element("td");
    			t7 = text(t7_value);
    			small0 = element("small");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			t10 = text(t10_value);
    			small1 = element("small");
    			t11 = text(t11_value);
    			t12 = space();
    			td6 = element("td");
    			t13 = text(t13_value);
    			t14 = space();
    			td7 = element("td");
    			t15 = text(t15_value);
    			t16 = space();
    			td8 = element("td");
    			t17 = text(t17_value);
    			t18 = space();
    			t19 = text(t19_value);
    			t20 = text(" /");
    			t21 = text(t21_value);
    			t22 = space();
    			td9 = element("td");
    			t23 = text(t23_value);
    			attr_dev(td0, "class", "nowrap text-center");
    			add_location(td0, file$3, 7, 4, 132);
    			attr_dev(td1, "class", "text-center");
    			add_location(td1, file$3, 8, 4, 191);
    			attr_dev(i, "class", "fas fa-compact-disc os-icon");
    			attr_dev(i, "title", i_title_value = /*server*/ ctx[0].os_id);
    			add_location(i, file$3, 10, 8, 280);
    			attr_dev(td2, "class", "text-center");
    			add_location(td2, file$3, 9, 4, 246);
    			attr_dev(td3, "class", "text-center");
    			add_location(td3, file$3, 12, 4, 363);
    			add_location(small0, file$3, 14, 52, 516);
    			attr_dev(td4, "class", "text-nowrap text-center");
    			add_location(td4, file$3, 14, 4, 468);
    			add_location(small1, file$3, 15, 53, 608);
    			attr_dev(td5, "class", "text-nowrap text-center");
    			add_location(td5, file$3, 15, 4, 559);
    			attr_dev(td6, "class", "text-nowrap text-center");
    			add_location(td6, file$3, 16, 4, 652);
    			attr_dev(td7, "class", "text-nowrap text-center");
    			add_location(td7, file$3, 17, 4, 719);
    			attr_dev(td8, "class", "text-nowrap text-center");
    			add_location(td8, file$3, 18, 4, 786);
    			attr_dev(td9, "class", "text-nowrap text-center");
    			add_location(td9, file$3, 19, 4, 895);
    			add_location(tr, file$3, 6, 0, 122);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, i);
    			append_dev(tr, t4);
    			append_dev(tr, td3);
    			append_dev(td3, t5);
    			append_dev(tr, t6);
    			append_dev(tr, td4);
    			append_dev(td4, t7);
    			append_dev(td4, small0);
    			append_dev(small0, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			append_dev(td5, t10);
    			append_dev(td5, small1);
    			append_dev(small1, t11);
    			append_dev(tr, t12);
    			append_dev(tr, td6);
    			append_dev(td6, t13);
    			append_dev(tr, t14);
    			append_dev(tr, td7);
    			append_dev(td7, t15);
    			append_dev(tr, t16);
    			append_dev(tr, td8);
    			append_dev(td8, t17);
    			append_dev(td8, t18);
    			append_dev(td8, t19);
    			append_dev(td8, t20);
    			append_dev(td8, t21);
    			append_dev(tr, t22);
    			append_dev(tr, td9);
    			append_dev(td9, t23);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*server*/ 1 && t0_value !== (t0_value = /*server*/ ctx[0].hostname + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*server*/ 1 && t2_value !== (t2_value = /*server*/ ctx[0].server_type + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*server*/ 1 && i_title_value !== (i_title_value = /*server*/ ctx[0].os_id)) {
    				attr_dev(i, "title", i_title_value);
    			}

    			if (dirty & /*server*/ 1 && t5_value !== (t5_value = /*server*/ ctx[0].cpu + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*server*/ 1 && t7_value !== (t7_value = /*server*/ ctx[0].ram + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*server*/ 1 && t8_value !== (t8_value = /*server*/ ctx[0].ram_type + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*server*/ 1 && t10_value !== (t10_value = /*server*/ ctx[0].disk + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*server*/ 1 && t11_value !== (t11_value = /*server*/ ctx[0].disk_type + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*server*/ 1 && t13_value !== (t13_value = /*server*/ ctx[0].location_id + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*server*/ 1 && t15_value !== (t15_value = /*server*/ ctx[0].provider_id + "")) set_data_dev(t15, t15_value);
    			if (dirty & /*server*/ 1 && t17_value !== (t17_value = /*server*/ ctx[0].price + "")) set_data_dev(t17, t17_value);
    			if (dirty & /*server*/ 1 && t19_value !== (t19_value = /*server*/ ctx[0].currency + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*server*/ 1 && t21_value !== (t21_value = /*terms*/ ctx[1][/*server*/ ctx[0].payment_term] + "")) set_data_dev(t21, t21_value);
    			if (dirty & /*server*/ 1 && t23_value !== (t23_value = /*server*/ ctx[0].owned_since + "")) set_data_dev(t23, t23_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Server', slots, []);
    	let { server } = $$props;
    	let terms = ["mo", "qr", "6mo", "yr", "2yr", "3yr", "once", "n/a"];
    	const writable_props = ['server'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Server> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('server' in $$props) $$invalidate(0, server = $$props.server);
    	};

    	$$self.$capture_state = () => ({ server, terms });

    	$$self.$inject_state = $$props => {
    		if ('server' in $$props) $$invalidate(0, server = $$props.server);
    		if ('terms' in $$props) $$invalidate(1, terms = $$props.terms);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [server, terms];
    }

    class Server extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { server: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Server",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*server*/ ctx[0] === undefined && !('server' in props)) {
    			console.warn("<Server> was created without expected prop 'server'");
    		}
    	}

    	get server() {
    		throw new Error("<Server>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set server(value) {
    		throw new Error("<Server>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\Home.svelte generated by Svelte v3.47.0 */
    const file$2 = "src\\pages\\Home.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (127:8) {:else}
    function create_else_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*servers*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*servers*/ 1) {
    				each_value = /*servers*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(127:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (125:8) {#if servers === undefined}
    function create_if_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading Servers...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(125:8) {#if servers === undefined}",
    		ctx
    	});

    	return block;
    }

    // (128:9) {#each servers as server, i}
    function create_each_block(ctx) {
    	let serveritem;
    	let current;

    	serveritem = new Server({
    			props: { server: /*server*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(serveritem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(serveritem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const serveritem_changes = {};
    			if (dirty & /*servers*/ 1) serveritem_changes.server = /*server*/ ctx[1];
    			serveritem.$set(serveritem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(serveritem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(serveritem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(serveritem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(128:9) {#each servers as server, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let div2;
    	let nav;
    	let div1;
    	let a0;
    	let t1;
    	let button;
    	let span;
    	let t2;
    	let div0;
    	let ul1;
    	let li0;
    	let a1;
    	let t4;
    	let li1;
    	let a2;
    	let t6;
    	let li2;
    	let a3;
    	let t8;
    	let li3;
    	let a4;
    	let t10;
    	let li4;
    	let a5;
    	let t12;
    	let li5;
    	let a6;
    	let t14;
    	let li14;
    	let a7;
    	let t16;
    	let ul0;
    	let li6;
    	let a8;
    	let t18;
    	let li7;
    	let a9;
    	let t20;
    	let li8;
    	let a10;
    	let t22;
    	let li9;
    	let a11;
    	let t24;
    	let li10;
    	let a12;
    	let t26;
    	let li11;
    	let a13;
    	let t28;
    	let li12;
    	let a14;
    	let t30;
    	let li13;
    	let a15;
    	let t32;
    	let a16;
    	let t34;
    	let div3;
    	let h3;
    	let t36;
    	let div8;
    	let div7;
    	let div6;
    	let div5;
    	let div4;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t38;
    	let th1;
    	let i0;
    	let t39;
    	let th2;
    	let t41;
    	let th3;
    	let i1;
    	let t42;
    	let th4;
    	let i2;
    	let t43;
    	let th5;
    	let i3;
    	let t44;
    	let th6;
    	let t46;
    	let th7;
    	let t48;
    	let th8;
    	let t50;
    	let th9;
    	let t52;
    	let tbody;
    	let current_block_type_index;
    	let if_block;
    	let t53;
    	let link0;
    	let t54;
    	let link1;
    	let t55;
    	let script;
    	let script_src_value;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*servers*/ ctx[0] === undefined) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			nav = element("nav");
    			div1 = element("div");
    			a0 = element("a");
    			a0.textContent = "My Idlers";
    			t1 = space();
    			button = element("button");
    			span = element("span");
    			t2 = space();
    			div0 = element("div");
    			ul1 = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "Servers";
    			t4 = space();
    			li1 = element("li");
    			a2 = element("a");
    			a2.textContent = "Shared";
    			t6 = space();
    			li2 = element("li");
    			a3 = element("a");
    			a3.textContent = "Reseller";
    			t8 = space();
    			li3 = element("li");
    			a4 = element("a");
    			a4.textContent = "Domains";
    			t10 = space();
    			li4 = element("li");
    			a5 = element("a");
    			a5.textContent = "Labels";
    			t12 = space();
    			li5 = element("li");
    			a6 = element("a");
    			a6.textContent = "Misc";
    			t14 = space();
    			li14 = element("li");
    			a7 = element("a");
    			a7.textContent = "More";
    			t16 = space();
    			ul0 = element("ul");
    			li6 = element("li");
    			a8 = element("a");
    			a8.textContent = "DNS";
    			t18 = space();
    			li7 = element("li");
    			a9 = element("a");
    			a9.textContent = "IPs";
    			t20 = space();
    			li8 = element("li");
    			a10 = element("a");
    			a10.textContent = "Locations";
    			t22 = space();
    			li9 = element("li");
    			a11 = element("a");
    			a11.textContent = "OS";
    			t24 = space();
    			li10 = element("li");
    			a12 = element("a");
    			a12.textContent = "Providers";
    			t26 = space();
    			li11 = element("li");
    			a13 = element("a");
    			a13.textContent = "YABs";
    			t28 = space();
    			li12 = element("li");
    			a14 = element("a");
    			a14.textContent = "Settings";
    			t30 = space();
    			li13 = element("li");
    			a15 = element("a");
    			a15.textContent = "Account";
    			t32 = space();
    			a16 = element("a");
    			a16.textContent = "Log Out";
    			t34 = space();
    			div3 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Servers";
    			t36 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Name";
    			t38 = space();
    			th1 = element("th");
    			i0 = element("i");
    			t39 = space();
    			th2 = element("th");
    			th2.textContent = "OS";
    			t41 = space();
    			th3 = element("th");
    			i1 = element("i");
    			t42 = space();
    			th4 = element("th");
    			i2 = element("i");
    			t43 = space();
    			th5 = element("th");
    			i3 = element("i");
    			t44 = space();
    			th6 = element("th");
    			th6.textContent = "Location";
    			t46 = space();
    			th7 = element("th");
    			th7.textContent = "Provider";
    			t48 = space();
    			th8 = element("th");
    			th8.textContent = "Price";
    			t50 = space();
    			th9 = element("th");
    			th9.textContent = "Had since";
    			t52 = space();
    			tbody = element("tbody");
    			if_block.c();
    			t53 = space();
    			link0 = element("link");
    			t54 = space();
    			link1 = element("link");
    			t55 = space();
    			script = element("script");
    			attr_dev(a0, "class", "navbar-brand");
    			attr_dev(a0, "href", "https://idlers.obelous.com");
    			add_location(a0, file$2, 16, 16, 524);
    			attr_dev(span, "class", "navbar-toggler-icon");
    			add_location(span, file$2, 19, 20, 848);
    			attr_dev(button, "class", "navbar-toggler");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-bs-toggle", "collapse");
    			attr_dev(button, "data-bs-target", "#navbarsExample09");
    			attr_dev(button, "aria-controls", "navbarsExample09");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-label", "Toggle navigation");
    			add_location(button, file$2, 17, 16, 613);
    			attr_dev(a1, "class", "nav-link");
    			attr_dev(a1, "href", "#/servers");
    			add_location(a1, file$2, 25, 28, 1139);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file$2, 24, 24, 1088);
    			attr_dev(a2, "class", "nav-link");
    			attr_dev(a2, "href", "#/shared");
    			add_location(a2, file$2, 30, 28, 1359);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$2, 29, 24, 1308);
    			attr_dev(a3, "class", "nav-link");
    			attr_dev(a3, "href", "#/reseller");
    			add_location(a3, file$2, 35, 28, 1577);
    			attr_dev(li2, "class", "nav-item");
    			add_location(li2, file$2, 34, 24, 1526);
    			attr_dev(a4, "class", "nav-link");
    			attr_dev(a4, "href", "#/domains");
    			add_location(a4, file$2, 40, 28, 1799);
    			attr_dev(li3, "class", "nav-item");
    			add_location(li3, file$2, 39, 24, 1748);
    			attr_dev(a5, "class", "nav-link");
    			attr_dev(a5, "href", "#/labels");
    			add_location(a5, file$2, 45, 28, 2019);
    			attr_dev(li4, "class", "nav-item");
    			add_location(li4, file$2, 44, 24, 1968);
    			attr_dev(a6, "class", "nav-link");
    			attr_dev(a6, "href", "#/misc");
    			add_location(a6, file$2, 50, 28, 2237);
    			attr_dev(li5, "class", "nav-item");
    			add_location(li5, file$2, 49, 24, 2186);
    			attr_dev(a7, "class", "nav-link dropdown-toggle");
    			attr_dev(a7, "href", "#");
    			attr_dev(a7, "id", "dropdown09");
    			attr_dev(a7, "data-bs-toggle", "dropdown");
    			attr_dev(a7, "aria-expanded", "false");
    			add_location(a7, file$2, 55, 28, 2460);
    			attr_dev(a8, "class", "dropdown-item");
    			attr_dev(a8, "href", "#/dns");
    			add_location(a8, file$2, 58, 36, 2738);
    			add_location(li6, file$2, 57, 32, 2696);
    			attr_dev(a9, "class", "dropdown-item");
    			attr_dev(a9, "href", "#/IPs");
    			add_location(a9, file$2, 61, 36, 2898);
    			add_location(li7, file$2, 60, 32, 2856);
    			attr_dev(a10, "class", "dropdown-item");
    			attr_dev(a10, "href", "#/locations");
    			add_location(a10, file$2, 64, 36, 3058);
    			add_location(li8, file$2, 63, 32, 3016);
    			attr_dev(a11, "class", "dropdown-item");
    			attr_dev(a11, "href", "#/os");
    			add_location(a11, file$2, 67, 36, 3230);
    			add_location(li9, file$2, 66, 32, 3188);
    			attr_dev(a12, "class", "dropdown-item");
    			attr_dev(a12, "href", "#/providers");
    			add_location(a12, file$2, 70, 36, 3388);
    			add_location(li10, file$2, 69, 32, 3346);
    			attr_dev(a13, "class", "dropdown-item");
    			attr_dev(a13, "href", "#/yabs");
    			add_location(a13, file$2, 73, 36, 3560);
    			add_location(li11, file$2, 72, 32, 3518);
    			attr_dev(a14, "class", "dropdown-item");
    			attr_dev(a14, "href", "#/settings");
    			add_location(a14, file$2, 76, 36, 3722);
    			add_location(li12, file$2, 75, 32, 3680);
    			attr_dev(a15, "class", "dropdown-item");
    			attr_dev(a15, "href", "#/account");
    			add_location(a15, file$2, 79, 36, 3892);
    			add_location(li13, file$2, 78, 32, 3850);
    			attr_dev(ul0, "class", "dropdown-menu");
    			attr_dev(ul0, "aria-labelledby", "dropdown09");
    			add_location(ul0, file$2, 56, 28, 2607);
    			attr_dev(li14, "class", "nav-item dropdown");
    			add_location(li14, file$2, 54, 24, 2400);
    			attr_dev(ul1, "class", "navbar-nav me-auto mb-2 mb-lg-0");
    			add_location(ul1, file$2, 23, 20, 1018);
    			attr_dev(a16, "class", "text-decoration-none");
    			attr_dev(a16, "href", "#/logout");
    			add_location(a16, file$2, 84, 20, 4099);
    			attr_dev(div0, "class", "collapse navbar-collapse");
    			attr_dev(div0, "id", "navbarsExample09");
    			add_location(div0, file$2, 22, 16, 936);
    			attr_dev(div1, "class", "container");
    			add_location(div1, file$2, 15, 12, 483);
    			attr_dev(nav, "class", "navbar navbar-expand-md navbar-light bg-light shadow-sm");
    			attr_dev(nav, "aria-label", "Eleventh navbar example");
    			add_location(nav, file$2, 14, 8, 363);
    			attr_dev(div2, "class", "container-fluid");
    			add_location(div2, file$2, 13, 4, 324);
    			attr_dev(h3, "class", "ms-2 mt-3");
    			add_location(h3, file$2, 93, 8, 4323);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$2, 92, 4, 4290);
    			attr_dev(th0, "class", "nowrap text-center");
    			add_location(th0, file$2, 104, 36, 4789);
    			attr_dev(i0, "class", "fas fa-box");
    			attr_dev(i0, "title", "Virt");
    			add_location(i0, file$2, 105, 60, 4891);
    			attr_dev(th1, "class", "text-center");
    			add_location(th1, file$2, 105, 36, 4867);
    			attr_dev(th2, "class", "text-center");
    			add_location(th2, file$2, 106, 36, 4973);
    			attr_dev(i1, "class", "fas fa-microchip");
    			attr_dev(i1, "title", "CPU");
    			add_location(i1, file$2, 107, 60, 5066);
    			attr_dev(th3, "class", "text-center");
    			add_location(th3, file$2, 107, 36, 5042);
    			attr_dev(i2, "class", "fas fa-memory");
    			attr_dev(i2, "title", "ram");
    			add_location(i2, file$2, 109, 60, 5254);
    			attr_dev(th4, "class", "text-center");
    			add_location(th4, file$2, 109, 36, 5230);
    			attr_dev(i3, "class", "fas fa-compact-disc");
    			attr_dev(i3, "title", "disk");
    			add_location(i3, file$2, 110, 60, 5362);
    			attr_dev(th5, "class", "text-center");
    			add_location(th5, file$2, 110, 36, 5338);
    			attr_dev(th6, "class", "text-nowrap text-center");
    			add_location(th6, file$2, 111, 36, 5453);
    			attr_dev(th7, "class", "text-nowrap text-center");
    			add_location(th7, file$2, 112, 36, 5540);
    			attr_dev(th8, "class", "text-nowrap text-center");
    			add_location(th8, file$2, 113, 36, 5627);
    			attr_dev(th9, "class", "text-nowrap text-center");
    			add_location(th9, file$2, 114, 36, 5711);
    			attr_dev(tr, "class", "bg-gray-100 bg-");
    			add_location(tr, file$2, 103, 32, 4723);
    			attr_dev(thead, "class", "table-light");
    			add_location(thead, file$2, 102, 28, 4662);
    			add_location(tbody, file$2, 123, 28, 6370);
    			attr_dev(table, "class", "table table-bordered");
    			add_location(table, file$2, 101, 24, 4596);
    			attr_dev(div4, "class", "table-responsive");
    			add_location(div4, file$2, 100, 20, 4540);
    			attr_dev(div5, "class", "card-body");
    			add_location(div5, file$2, 99, 16, 4495);
    			attr_dev(div6, "class", "card shadow mt-3");
    			add_location(div6, file$2, 98, 12, 4447);
    			attr_dev(div7, "class", "container");
    			add_location(div7, file$2, 97, 8, 4410);
    			attr_dev(div8, "class", "container");
    			add_location(div8, file$2, 96, 4, 4377);
    			add_location(main, file$2, 12, 0, 312);
    			attr_dev(link0, "rel", "stylesheet");
    			attr_dev(link0, "href", "https://idlers.obelous.com/css/bootstrap.min.css");
    			add_location(link0, file$2, 141, 0, 6761);
    			attr_dev(link1, "rel", "stylesheet");
    			attr_dev(link1, "href", "https://idlers.obelous.com/css/fa.min.css");
    			add_location(link1, file$2, 142, 0, 6844);
    			if (!src_url_equal(script.src, script_src_value = "https://idlers.obelous.com/js/bootstrap.min.js")) attr_dev(script, "src", script_src_value);
    			script.defer = "";
    			add_location(script, file$2, 145, 1, 6938);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, nav);
    			append_dev(nav, div1);
    			append_dev(div1, a0);
    			append_dev(div1, t1);
    			append_dev(div1, button);
    			append_dev(button, span);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, ul1);
    			append_dev(ul1, li0);
    			append_dev(li0, a1);
    			append_dev(ul1, t4);
    			append_dev(ul1, li1);
    			append_dev(li1, a2);
    			append_dev(ul1, t6);
    			append_dev(ul1, li2);
    			append_dev(li2, a3);
    			append_dev(ul1, t8);
    			append_dev(ul1, li3);
    			append_dev(li3, a4);
    			append_dev(ul1, t10);
    			append_dev(ul1, li4);
    			append_dev(li4, a5);
    			append_dev(ul1, t12);
    			append_dev(ul1, li5);
    			append_dev(li5, a6);
    			append_dev(ul1, t14);
    			append_dev(ul1, li14);
    			append_dev(li14, a7);
    			append_dev(li14, t16);
    			append_dev(li14, ul0);
    			append_dev(ul0, li6);
    			append_dev(li6, a8);
    			append_dev(ul0, t18);
    			append_dev(ul0, li7);
    			append_dev(li7, a9);
    			append_dev(ul0, t20);
    			append_dev(ul0, li8);
    			append_dev(li8, a10);
    			append_dev(ul0, t22);
    			append_dev(ul0, li9);
    			append_dev(li9, a11);
    			append_dev(ul0, t24);
    			append_dev(ul0, li10);
    			append_dev(li10, a12);
    			append_dev(ul0, t26);
    			append_dev(ul0, li11);
    			append_dev(li11, a13);
    			append_dev(ul0, t28);
    			append_dev(ul0, li12);
    			append_dev(li12, a14);
    			append_dev(ul0, t30);
    			append_dev(ul0, li13);
    			append_dev(li13, a15);
    			append_dev(div0, t32);
    			append_dev(div0, a16);
    			append_dev(main, t34);
    			append_dev(main, div3);
    			append_dev(div3, h3);
    			append_dev(main, t36);
    			append_dev(main, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t38);
    			append_dev(tr, th1);
    			append_dev(th1, i0);
    			append_dev(tr, t39);
    			append_dev(tr, th2);
    			append_dev(tr, t41);
    			append_dev(tr, th3);
    			append_dev(th3, i1);
    			append_dev(tr, t42);
    			append_dev(tr, th4);
    			append_dev(th4, i2);
    			append_dev(tr, t43);
    			append_dev(tr, th5);
    			append_dev(th5, i3);
    			append_dev(tr, t44);
    			append_dev(tr, th6);
    			append_dev(tr, t46);
    			append_dev(tr, th7);
    			append_dev(tr, t48);
    			append_dev(tr, th8);
    			append_dev(tr, t50);
    			append_dev(tr, th9);
    			append_dev(table, t52);
    			append_dev(table, tbody);
    			if_blocks[current_block_type_index].m(tbody, null);
    			insert_dev(target, t53, anchor);
    			insert_dev(target, link0, anchor);
    			insert_dev(target, t54, anchor);
    			insert_dev(target, link1, anchor);
    			insert_dev(target, t55, anchor);
    			append_dev(document.head, script);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(tbody, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t53);
    			if (detaching) detach_dev(link0);
    			if (detaching) detach_dev(t54);
    			if (detaching) detach_dev(link1);
    			if (detaching) detach_dev(t55);
    			detach_dev(script);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	let servers;

    	onMount(async () => {
    		const response = await fetch('http://localhost:3000/admin/servers');
    		const data = await response.json();
    		$$invalidate(0, servers = data);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ onMount, ServerItem: Server, servers });

    	$$self.$inject_state = $$props => {
    		if ('servers' in $$props) $$invalidate(0, servers = $$props.servers);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [servers];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\pages\Login.svelte generated by Svelte v3.47.0 */

    const file$1 = "src\\pages\\Login.svelte";

    function create_fragment$2(ctx) {
    	let div5;
    	let div4;
    	let div3;
    	let h3;
    	let t1;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div1;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let div2;
    	let input2;
    	let t8;
    	let label2;
    	let t10;
    	let a;
    	let t12;
    	let button;
    	let t14;
    	let link;
    	let t15;
    	let script;
    	let script_src_value;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			h3 = element("h3");
    			h3.textContent = "My idlers";
    			t1 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Email";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Password";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div2 = element("div");
    			input2 = element("input");
    			t8 = space();
    			label2 = element("label");
    			label2.textContent = "Remember me";
    			t10 = space();
    			a = element("a");
    			a.textContent = "Forgot your password?";
    			t12 = space();
    			button = element("button");
    			button.textContent = "Login";
    			t14 = space();
    			link = element("link");
    			t15 = space();
    			script = element("script");
    			attr_dev(h3, "class", "text-center mb-4");
    			add_location(h3, file$1, 6, 6, 158);
    			attr_dev(label0, "class", "small text-muted svelte-sbmbjr");
    			attr_dev(label0, "for", "email");
    			add_location(label0, file$1, 9, 14, 265);
    			attr_dev(input0, "class", "form-control svelte-sbmbjr");
    			attr_dev(input0, "id", "email");
    			attr_dev(input0, "type", "email");
    			attr_dev(input0, "name", "email");
    			input0.required = "required";
    			input0.autofocus = "autofocus";
    			add_location(input0, file$1, 10, 14, 338);
    			attr_dev(div0, "class", "form-floating mb-3 svelte-sbmbjr");
    			add_location(div0, file$1, 8, 12, 217);
    			attr_dev(label1, "class", "small text-muted svelte-sbmbjr");
    			attr_dev(label1, "for", "password");
    			add_location(label1, file$1, 14, 14, 531);
    			attr_dev(input1, "class", "form-control svelte-sbmbjr");
    			attr_dev(input1, "id", "password");
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "name", "password");
    			input1.required = "required";
    			attr_dev(input1, "autocomplete", "current-password");
    			add_location(input1, file$1, 15, 14, 610);
    			attr_dev(div1, "class", "form-floating mb-3 svelte-sbmbjr");
    			add_location(div1, file$1, 13, 12, 483);
    			attr_dev(input2, "class", "form-check-input");
    			attr_dev(input2, "type", "checkbox");
    			input2.value = "remember-me";
    			attr_dev(input2, "id", "remember-me");
    			add_location(input2, file$1, 19, 14, 819);
    			attr_dev(label2, "class", "form-check-label");
    			attr_dev(label2, "for", "remember-me");
    			add_location(label2, file$1, 20, 14, 922);
    			attr_dev(div2, "class", "form-check mb-3");
    			add_location(div2, file$1, 18, 12, 774);
    			attr_dev(a, "class", "text-decoration-none");
    			attr_dev(a, "href", "https://idlers.obelous.com/forgot-password");
    			add_location(a, file$1, 23, 12, 1027);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150 mt-3 w-100 btn btn-lg btn-primary");
    			add_location(button, file$1, 25, 12, 1150);
    			attr_dev(div3, "class", "card-body shadow");
    			add_location(div3, file$1, 2, 4, 53);
    			attr_dev(div4, "class", "card");
    			add_location(div4, file$1, 1, 2, 29);
    			attr_dev(div5, "class", "form-signin svelte-sbmbjr");
    			add_location(div5, file$1, 0, 0, 0);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://idlers.obelous.com/css/bootstrap.min.css");
    			add_location(link, file$1, 69, 0, 2256);
    			if (!src_url_equal(script.src, script_src_value = "https://idlers.obelous.com/js/bootstrap.min.js")) attr_dev(script, "src", script_src_value);
    			script.defer = "";
    			add_location(script, file$1, 72, 1, 2357);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, h3);
    			append_dev(div3, t1);
    			append_dev(div3, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			append_dev(div3, t4);
    			append_dev(div3, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t6);
    			append_dev(div1, input1);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, input2);
    			append_dev(div2, t8);
    			append_dev(div2, label2);
    			append_dev(div3, t10);
    			append_dev(div3, a);
    			append_dev(div3, t12);
    			append_dev(div3, button);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, link, anchor);
    			insert_dev(target, t15, anchor);
    			append_dev(document.head, script);
    			input0.focus();
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(link);
    			if (detaching) detach_dev(t15);
    			detach_dev(script);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\pages\NotFound.svelte generated by Svelte v3.47.0 */

    const file = "src\\pages\\NotFound.svelte";

    function create_fragment$1(ctx) {
    	let h2;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "NotFound";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Oops, this route doesn't exist!";
    			add_location(h2, file, 0, 0, 0);
    			add_location(p, file, 2, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NotFound', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NotFound> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var routes = {
        '/': Home,
        '/login': Login,
        '*': NotFound,
    };

    /* src\App.svelte generated by Svelte v3.47.0 */

    function create_fragment(ctx) {
    	let router;
    	let current;
    	router = new Router({ props: { routes }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router, routes });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
