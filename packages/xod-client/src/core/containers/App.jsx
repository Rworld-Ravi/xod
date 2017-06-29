import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { Either } from 'ramda-fantasy';
import { Project, getProjectName, isValidProject } from 'xod-project';
import { transpileForEspruino, transpileForNodeJS } from 'xod-js';
import { transpileForArduino } from 'xod-arduino';
import { foldEither } from 'xod-func-tools';

import { getJSONForExport } from '../../project/utils';
import { SAVE_LOAD_ERRORS } from '../../messages/constants';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

export default class App extends React.Component {
  onShowCodeEspruino() {
    this.transpile(transpileForEspruino);
  }
  onShowCodeNodejs() {
    this.transpile(transpileForNodeJS);
  }
  onShowCodeArduino() {
    this.transpile(transpileForArduino);
  }

  onImport(json) {
    const eitherProject = R.tryCatch(
      R.pipe(JSON.parse, Either.of),
      R.always(Either.Left(SAVE_LOAD_ERRORS.NOT_A_JSON))
    )(json).chain(
      R.ifElse(
        isValidProject,
        Either.of,
        R.always(Either.Left(SAVE_LOAD_ERRORS.INVALID_FORMAT))
      )
    );

    Either.either(
      this.props.actions.addError,
      this.props.actions.importProject,
      eitherProject
    );
  }

  onExport() {
    const { project } = this.props;

    const projectJSON = getJSONForExport(project);
    const projectName = getProjectName(project);
    const link = (document) ? document.createElement('a') : null;
    const url = `data:application/xod;charset=utf8,${encodeURIComponent(projectJSON)}`;

    if (link && link.download !== undefined) {
      link.href = url;
      link.setAttribute('download', `${projectName}.xodball`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(url, '_blank');
      window.focus();
    }
  }

  transpile(transpiler) {
    const { project, currentPatchPath } = this.props;
    const eitherCode = transpiler(project, currentPatchPath);
    foldEither(
      (error) => {
        console.error(error); // eslint-disable-line no-console
        this.props.actions.addError(error.message);
      },
      (code) => {
        this.props.actions.showCode(code);
      },
      eitherCode
    );
  }

  render() {
    return <div />;
  }
}

App.propTypes = {
  project: sanctuaryPropType(Project),
  currentPatchPath: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  actions: PropTypes.shape({
    addError: PropTypes.func.isRequired,
    importProject: PropTypes.func.isRequired,
    showCode: PropTypes.func.isRequired,
  }),
};
