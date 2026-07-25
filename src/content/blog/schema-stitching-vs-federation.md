---
title: "GraphQL Schema Stitching vs Apollo Federation"
description: "Evaluating the two approaches to combining multiple micro GraphQL APIs in a startup environment without impacting product timelines."
pubDate: "2023/02/01"
heroImage: "./large_clusters_of_bright_dots_and_connecting_lines_on_a_field_of_inky_black.webp"
heroImageText: "An image generated using DALL.E with the prompt: large clusters of bright dots and connecting lines on a field of inky black"
---

## Existing architecture

HeadBox is a small event tech startup with multiple micro front and back end services and a long history of using GraphQL in production. Unfortunately that GraphQL use has historically been, as coined by my friend Kai “REST over GraphQL”. Each back end service published its own graph and front end services then consumed each graph individually, historically this was not an issue because both services would be built at the same time to solve a single problem. However as products matured and the commercial requirements evolved front ends would start to need data from more than one back end, a problem because GraphQL client libraries are designed to only communicate with one graph at a time.

To avoid this problem some of the back end services evolved from being a micro service, to being a micro service and a back end for front end service. When a front end (A) required some data that was not held by the back end service it was tightly coupled with (B), that back end would make a GraphQL request to the back end service that did hold the data (C), the initial back end service (B) would then return that data to the front end (A) in its own graph.

```d2
shape: sequence_diagram
a: Frontend service A
b: Backend service B
c: Backend service C

a -> b: Front end requests data from its backend service
b -> c: Backend service B requests data from backend service C
c -> b
b -> A
```

Over time technical debt built up as some services were accessed directly while others were accessed by proxy with different front ends all adopting their own unique behaviours. Because of the lack of cohesion across services a number of undesirable behaviours developed.

- Objects that were of the same type were exposed by different services under different names, for example the types Features, Facilities and SpaceFacilities were all the same object
- Queries and mutations were named inconsistently, some services would expose getUserById, others would just expose user
- All of the services used id as a unique identifier, except one, which used ID from its GraphQL schema all the way down to the database schema

## Constraints

Clearly given a magic wand there would be a single GraphQL gateway where all types are unified and a clear naming convention is followed, to arrive at that point in the real world however required an iterative approach taking into account a number of constraints.

- There can be no disruption or down time for existing products
- Any impact on product delivery timelines must be as small as possible, ideally there should be no impact at all
- It must work for both of HeadBox’s products, these two products share a lot of common services but ultimately solve similar but distinct problems for different customers and this results in some conflicting types and so they cannot be in the same graph
- Because HeadBox has a low user count but high average transaction volume the number of total requests made is low, as a result GraphQL is used for back end to back end communication because there is not a need for anything more complex. This pattern cannot be changed because the cost would be prohibitively large and would provide no benefit to the business

## Apollo Federation

There are two possible solutions to this problem, Apollo Federation and schema stitching. Schema stitching was originally created by Apollo and was the technology used to enable the first version of federation, however Apollo has created a new way of enabling federation and schema stitching is now being maintained by The Guild. These two approaches are quite different in how they solve this problem. Apollo Federation is designed for large organisations where a lot of teams need to contribute to the graph and the deployed gateway service must be as performant as possible. To achieve this Apollo have created a number of custom GraphQL directives that are applied to the micro-service’s subgraphs, these directives describe how the types in the subgraph can be combined together with the types from other subgraphs to create the supergraph which is deployed to the gateway service. The advantage of this approach is that the complexity of describing how the subgraphs fit together and the computational load of complex operations like batching are both borne by the subgraph service with each team in an organisation able to independently manage their own subgraphs. The supergraph gateway service simply acts as a router, breaking each request into parts and routing it to the relevant subgraphs.

When deploying GraphQL at scale federation can easily solve a lot of problems with horizontally scaling a gateway, but for HeadBox there are three problems:

- The initial setup cost is higher, it requires modification and re-deployment of every single subgraph in an organisation before it can be a part of the supergraph; which requires work from every team.
- Apollo advises that a subgraph is not queried directly and it is only the supergraph which is queried, this is because a federated subgraph exposes some additional powerful fields which are not part of the GraphQL specification https://www.apollographql.com/docs/federation/building-supergraphs/subgraphs-overview/#securing-your-subgraphs. While custom directives do not prevent you querying a subgraph directly it is important to only use tools in the manner they are designed to be used in and Apollo could change the way a subgraph works in the future.
- Because a subgraph is tightly coupled to its supergraph you can have only one subgraph per microservice per supergraph.

## Schema Stitching

By contrast when using schema stitching all of the configuration and computation to build and operate the gateway takes place on the gateway itself. Rather than each subgraph declaring how it fits into a wider supergraph, the gateway service holds code on how to query each service and how to stitch the returned objects together. Instead of being a router that breaks a request apart and routes it accordingly, the gateway is a GraphQL client that does the heavy lifting of fetching and combining the data itself.

There are a number of advantages to this approach:

- The entire system is much simpler and self contained, the cost of initially creating a gateway is no different to creating any other new micro-service and can easily be created by a single team.
- There is no coupling between the underlying services and the gateway, your subschemas can continue to be queried as independent entities, this allows for backend to backend GraphQL querying or multiple gateways.
- Because a gateway server can stitch an internal schema just as easily as an external one https://the-guild.dev/graphql/stitching/docs/getting-started/basic-example you can use a gateway as a proxy for any type of service, not just GraphQL services.

There are however some downsides:

- The computational load of any heavy lifting like batch fetching and then stitching large queries will be borne entirely by the gateway.
- There must be one code base shared between however many teams are contributing to the gateway, this is an overhead that will require some degree of management. In a large enough organisation this will likely necessitate someone or a team acting in a platform capacity.

## Solution

For HeadBox federation was impractical because the two products cannot exist in the same supergraph, this necessitates two supergraphs, which in turn means two subgraphs per microservice. This would increase the workload on developers modifying either graph because they would need to ensure that the correct changes are being made to the correct graph and would often be duplicating work. This would lead to bugs. On top of this because HeadBox uses GraphQL for backend to backend communication and these requests do not go through the supergraph anyone implementing new backend to backend communication would need to be cognisant that there are two subgraphs per service with subtle differences. This would again lead to bugs.

In contrast the additional computational load on a stitched schema gateway would not be a problem at HeadBox’s scale and the management overhead would be easy to handle in a team with less than 10 developers. Should HeadBox scale to the point that the constraints of a stitched schema gateway become a problem Apollo provides a guide on how to migrate to Apollo Federation incrementally https://www.apollographql.com/docs/federation/migrating-from-stitching/.

Given the significantly lower costs of implementation and maintenance schema stitching was the clear way forward.

## Filtering

The next problem to solve is how to consolidate the inconsistent naming of types, queries and mutations across the different micro-services. None of them can be renamed in-situ because there are front and back end services currently pointed at them that are built to use the existing names. Fortunately a stitched schema gateway has access to transforms https://the-guild.dev/graphql/stitching/docs/transforms which let us modify a schema before it is included in the gateway. Specifically we can mark a field as deprecated using the @deprecated directive https://spec.graphql.org/June2018/#sec--deprecated and include a custom string in the message, in this instance GATEWAY_EXCLUDED, which we can then filter out https://the-guild.dev/graphql/stitching/docs/transforms/filtering#filtering-root-fields. This has no impact on existing uses of deprecated fields because the deprecated directive is advisory only and does not impact the functionality of the schema.

Filtering out anything marked as GATEWAY_EXCLUDED can be done with the below function, anything the function returns true for will be included in the schema:

```typescript
import { FilterObjectFields, FilterRootFields } from "@graphql-tools/wrap";
import { GraphQLFieldConfig } from "graphql";

const filterGatewayExcluded = (
  _: any,
  __: any,
  fieldConfig: GraphQLFieldConfig<any, any, any>,
) =>
  fieldConfig.deprecationReason == null
    ? true
    : !fieldConfig.deprecationReason.includes("GATEWAY_EXCLUDED");

export const filterGatewayExcludedTransforms = [
  new FilterObjectFields(filterGatewayExcluded),
  new FilterRootFields(filterGatewayExcluded),
];
```

First we make sure that all fields without the @deprecated directive are included in the schema:

```typescript
fieldConfig.deprecationReason == null
	? true
```

We then remove only the deprecated fields where the reason includes GATEWAY_EXCLUDED:

```typescript
: !fieldConfig.deprecationReason.includes('GATEWAY_EXCLUDED')
```

Finally we export the two filter functions to cover all field types in the schema in an array, this array can then be spread into the transforms property on each subschema https://the-guild.dev/graphql/stitching/docs/transforms/filtering#filtering-root-fields:

```typescript
export const filterGatewayExcludedTransforms = [
  new FilterObjectFields(filterGatewayExcluded),
  new FilterRootFields(filterGatewayExcluded),
];
```

This allows a gradual migration path, when a front end micro-site requires a large piece of product work the gateway can be updated to stitch any required back ends into the gateway schema. As new back end services are integrated into the gateway naming inconsistencies are ideally resolved by the complete retirement of any incorrect names across all services. Where this is not possible, types can be duplicated in the micro-service’s schema with a shared resolver for both fields to prevent code duplication, the old name can then be marked with GATEWAY_EXCLUDED to prevent its use by any service pointed to the gateway.

## Implementation

To finish the gateway we need a way to host two different graphs for the two different products, while ensuring that common services are stitched into both and the code to achieve that stitching only exists in one place. As we saw above the custom filter exports its filters in such a way that they can be applied to any subschema. This same approach can be used on subschemas themselves; they can be created in isolation and then imported into a gateway’s schema. This allows us to have two top level schemas, each sharing the subschemas for common micro-services while implementing their own independent subschemas.

From this point the implementation was a simple case of creating a new service and following the documentation https://the-guild.dev/graphql/stitching/docs. To publish the two different schemas, we simply run two instances of apollo server, each with a different schema and URL.

## Cost

Creating a brand new gateway service and it’s schema is not a small piece of work and justifying the engineering time would have been a challenge were it not completed as part of an extensive rebuild of HeadBox’s B2B product. This project required a large number of changes to the API layer and the technical debt that had been accrued with the old approach meant that there was a minimal cost difference between making these changes in the old style vs creating the gateway.

Longer term there is also a maintenance cost for any service and a gateway is no exception, fortunately the more services the gateway stitches the greater its value becomes. It centralises the job of collecting data from multiple back ends, the cost of combining this data is only born once, when it is added to the gateway, rather than every time a new feature is written. Not only does this reduce the work to create new front end features but it reduces the work required to maintain existing front end features.

## Conclusion

The creation of a gateway at HeadBox was an immediate success, combined with a parallel project to introduce GraphQL Code Generator in front end code bases it resulted in immediate gains to developer velocity, reducing the work required to deliver two new front end microsites and to overhaul a third.

It did this while achieving its original goals, there was no impact on product delivery timelines, the worst type name discrepancy was resolved with a clear pathway to resolve the renaming discrepancies and the gateway is ready to support both teams and products.
