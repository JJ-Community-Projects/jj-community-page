/* eslint-disable */
/// <reference path="../../worker-configuration.d.ts" />

declare namespace Cloudflare {
  interface Env {
    ScheduleEditingObject: DurableObjectNamespace<import("../worker").ScheduleEditingObject>;
  }
}

interface Env extends Cloudflare.Env {}
