# Scenario comparison UI — incremental controls and smoke steps

The existing catalog, exact-snapshot inspection, baseline creation, real comparison
request, retained result, metrics, asset list and MapLibre layers are reused.

## Changed controls and presentation

- **Baseline / Scenario / Difference** now share the displayed result's comparison
  ID, creation time, exact run IDs, generation times and simulation windows across
  the header, sidebar and map. The sidebar also shows the selected run's recorded
  forcing. Difference identifies both runs. These are hypothetical peak summaries,
  not live values or a replay cursor; demo alert/action counts and officer/hotline
  context are hidden while comparing.
- **Response priorities** displays supplied baseline/scenario ranks, scores,
  scenario-minus-baseline changes and each run's provided reasons/actions. No
  score or action is generated. A null array is explicitly unavailable; an empty
  array means no priorities supplied; a missing zone is not treated as a zero.
  The current backend still has no executable priority methodology and returns
  null arrays. Component tests alone use labelled mock rankings.
- **Map fit** returns to the exact comparison extents. A verified empty difference
  says “No newly inundated area”; null geometry remains unavailable. A counterpart
  run may situate an empty/missing extent without supplying a replacement footprint.
  Map-loading/rendering errors stay visible and numeric results remain readable.
- **Scenario dialog** contains keyboard focus, closes with Escape, restores the
  trigger focus, and isolates dashboard shortcuts. Empty catalogs and loading
  states are explicit. Closing the dialog does not cancel a solver operation;
  page progress and baseline-creation errors remain visible after closing.

## Manual smoke steps

1. Start the dashboard using the existing instructions in `SCENARIO_COMPARISON.md`
   and the intended API origin. Open Overview's comparison dialog using a keyboard.
   Check Tab/Shift+Tab containment, Escape and return focus.
2. Choose a completed catalog baseline and inspect its run ID/window/forcing.
   Complete a comparison using the existing workflow. While pending, close the
   dialog and check that elapsed progress stays visible; if a prior result exists,
   its ID/context remains displayed until a new successful comparison arrives.
3. Switch Baseline, Scenario and Difference. Check that header/sidebar/map identify
   the same displayed result and selected run(s), with no illustrative timeline,
   alert counts or profile values. Read the preserved model-domain and nonlocal
   inventory warnings.
4. Check zoom and Fit selected comparison run extents in a WebGL-capable browser.
   Verify that difference colors/assets switch without stale hover labels. For an
   actual empty difference, verify the empty-state text; null geometry must say
   unavailable and must never substitute an illustrative footprint.
5. The real backend's null priority arrays must remain unavailable. Supplied-array,
   partial-array and empty-array behavior is covered only by labelled component
   mocks until an executable backend scoring methodology is supplied.

Browser/WebGL interactions, including actual focus behavior, require this manual
smoke test; server rendering and HTTP checks do not verify them.
