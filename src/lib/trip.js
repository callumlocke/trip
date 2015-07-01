import prettyHRTime from 'pretty-hrtime';
import {gray, cyan, red, green} from 'chalk';
import {isString, isFunction} from 'lodash';
import Promise from 'bluebird';

const trip = {
  _running: 0,
  run,
  log,
};


export default trip;


export async function run(taskName) {
  const actions = trip.tasks[taskName];

  if (!Array.isArray(actions)) {
    throw new Error('task not found: "' + taskName + '"');
  }

  // run all the tasks in series
  const taskStart = process.hrtime();
  log(cyan(taskName), gray('started'));
  trip._running++;

  try {
    for (let i = 0, l = actions.length; i < l; i++) {
      const action = actions[i];

      if (Array.isArray(action)) {
        // run all of the sub-actions in parallel
        await Promise.map(action, subAction => { // eslint-disable-line no-loop-func
          if (Array.isArray(subAction)) throw new Error('tasks nested too deeply.');

          if (isString(subAction)) return run(subAction);
          else if (isFunction(subAction)) return subAction.call(trip);

          throw new TypeError(`unexpected type for subtask: ${typeof subAction}`);
        });
      }

      else {
        // it's a singular task - either a string or a function.
        if (isString(action)) await run(action);
        else if (isFunction(action)) await Promise.resolve(action.call(trip));
        else throw new TypeError(`unexpected type for action ${i} of task: ${typeof action}`);
      }
    }

    trip._running--;
  }
  catch (error) {
    log(
      cyan(taskName),
      red('✘ error'),
      gray(prettyHRTime(process.hrtime(taskStart)))
    );

    throw error;
  }


  log(
    cyan(taskName),
    green('✓'),
    gray(prettyHRTime(process.hrtime(taskStart)))
  );
}


export function log(...args) {
  const date = new Date();
  let hh = date.getHours() + '';
  let mm = date.getMinutes() + '';
  let ss = date.getSeconds() + '';

  if (hh.length < 2) hh = '0' + hh;
  if (mm.length < 2) mm = '0' + mm;
  if (ss.length < 2) ss = '0' + ss;

  console.log(
    gray(`[${hh}:${mm}:${ss}]`),
    args.join(' ')
  );
}


// share some utils
export Promise from 'bluebird';
export _ from 'lodash';
