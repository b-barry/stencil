import { BuildConfig, BuildContext, ComponentMeta, BuildConditionals, ManifestBundle, ModuleFile } from '../../util/interfaces';
import { ENCAPSULATION, MEMBER_TYPE, PROP_TYPE } from '../../util/constants';


export function setBuildConditionals(config: BuildConfig, ctx: BuildContext, manifestBundles: ManifestBundle[]) {
  // figure out which sections of the core code this build doesn't even need
  const coreBuild: BuildConditionals = ({} as any);

  const timeSpan = config.logger.createTimeSpan('setBuildConditionals start', true);

  manifestBundles.forEach(manifestBundle => {
    manifestBundle.moduleFiles.forEach(moduleFile => {
      if (moduleFile.cmpMeta) {
        setBuildFromComponentMeta(coreBuild, moduleFile.cmpMeta);
        setBuildFromComponentContent(ctx, coreBuild, moduleFile);
      }
    });
  });

  timeSpan.finish('setBuildConditionals start');

  return coreBuild;
}


export function setBuildFromComponentMeta(coreBuild: BuildConditionals, cmpMeta: ComponentMeta) {
  if (!cmpMeta || !cmpMeta.membersMeta) return;

  const memberNames = Object.keys(cmpMeta.membersMeta);
  memberNames.forEach(memberName => {
    const memberType = cmpMeta.membersMeta[memberName].memberType;
    const propType = cmpMeta.membersMeta[memberName].propType;

    if (memberType === MEMBER_TYPE.Prop || memberType === MEMBER_TYPE.PropMutable) {
      if (propType === PROP_TYPE.String || propType === PROP_TYPE.Number || propType === PROP_TYPE.Boolean || propType === PROP_TYPE.Any) {
        coreBuild.observeAttr = true;
      }

    } else if (memberType === MEMBER_TYPE.PropConnect) {
      coreBuild.propConnect = true;

    } else if (memberType === MEMBER_TYPE.PropContext) {
      coreBuild.propContext = true;

    } else if (memberType === MEMBER_TYPE.Method) {
      coreBuild.method = true;

    } else if (memberType === MEMBER_TYPE.Element) {
      coreBuild.element = true;
    }
  });

  if (!coreBuild.event) {
    coreBuild.event = !!(cmpMeta.eventsMeta && cmpMeta.eventsMeta.length);
  }

  if (!coreBuild.listener) {
    coreBuild.listener = !!(cmpMeta.listenersMeta && cmpMeta.listenersMeta.length);
  }

  if (!coreBuild.shadowDom) {
    coreBuild.shadowDom = (cmpMeta.encapsulation === ENCAPSULATION.ShadowDom);
  }

  if (!coreBuild.scopedCss) {
    coreBuild.scopedCss = (cmpMeta.encapsulation === ENCAPSULATION.ScopedCss);
  }

  if (!coreBuild.styles) {
    coreBuild.styles = !!cmpMeta.stylesMeta;
  }

  if (!coreBuild.hostTheme) {
    coreBuild.hostTheme = !!(cmpMeta.hostMeta && cmpMeta.hostMeta.theme);
  }
}


export function setBuildFromComponentContent(ctx: BuildContext, coreBuild: BuildConditionals, moduleFile: ModuleFile) {
  let jsText = ctx.jsFiles[moduleFile.jsFilePath];
  if (typeof jsText !== 'string') return;

  // hacky to do it this way...yeah
  // but with collections the components may have been
  // built many moons ago, so we don't want to lock ourselves
  // into a very certain way that components can be parsed
  // so here we're just doing raw string checks, and there
  // wouldn't be any harm if a build section was included when it
  // wasn't needed, but these keywords are all pretty unique already

  if (!coreBuild.cmpWillLoad) {
    coreBuild.cmpWillLoad = (jsText.indexOf('componentWillLoad') > -1);
  }

  if (!coreBuild.cmpDidLoad) {
    coreBuild.cmpDidLoad = (jsText.indexOf('componentDidLoad') > -1);
  }

  if (!coreBuild.cmpWillUpdate) {
    coreBuild.cmpWillUpdate = (jsText.indexOf('componentWillUpdate') > -1);
  }

  if (!coreBuild.cmpDidUpdate) {
    coreBuild.cmpDidUpdate = (jsText.indexOf('componentDidUpdate') > -1);
  }

  if (!coreBuild.cmpDidUnload) {
    coreBuild.cmpDidUnload = (jsText.indexOf('componentDidUnload') > -1);
  }

  if (!coreBuild.hostData) {
    coreBuild.hostData = (jsText.indexOf('hostData') > -1);
  }

  if (!coreBuild.render) {
    coreBuild.render = (jsText.indexOf('render') > -1);
  }

  if (!coreBuild.svg) {
    jsText = jsText.toLowerCase();
    coreBuild.svg = (jsText.indexOf('svg') > -1);
  }
}
