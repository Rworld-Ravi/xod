
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { default as chai, expect } from 'chai';
import dirtyChai from 'dirty-chai';
import core from 'xod-core';

import { runtime, transpile } from 'xod-espruino';
import initialState from '../src/core/state';
import generateReducers from '../src/core/reducer';
import { addNode } from '../src/project/actions';

chai.use(dirtyChai);

describe('xod-espruino', () => {
  it('should transpile example initial state to kinda valid code', () => {
    const store = createStore(generateReducers([1]), initialState, applyMiddleware(thunk));
    const nodeId = store.dispatch(addNode('core/button', { x: 100, y: 100 }, '1'));

    const projectJSON = core.getProjectJSON(store.getState());
    const project = JSON.parse(projectJSON);
    const code = transpile({ project, runtime });

    // We test the code generated by fare evaluation. Yes, this
    // will inject variables to the scope, so we limit it with an
    // anonimous function.
    /* eslint-disable no-undef */
    (() => {
      const mod = eval.call(null, code); // eslint-disable-line
      expect(project).to.exist();
      expect(nodes).to.exist();
      expect(topology).to.exist();
      expect(onInit).to.exist();

      expect(nodes).to.have.keys(nodeId);
      expect(topology).to.be.eql([nodeId]);
    })();
    /* eslint-enable no-undef */
  });
});
