---
title: "Your code should be lazy"
description: "Advocating for the benefits of the return early and separation of concerns patterns through the analogy of code being lazy and not wanting to do any more work than absolutely necessary."
pubDate: "2025/03/11"
heroImage: "./lazy-computer.webp"
heroImageText: "An image generated using DeepAI with the prompt: a cartoon drawing of a very lazy computer that doesn't want to do any work"
---

It is very easy when coding to inadvertently write spaghetti, you start with the best of intentions and a nice clean file. But then some bugs are fixed, a deadline gets crunched and that one lazy developer mangles your beautiful code; before long, you’ve got the digital equivalent of a carbonara. Many words have been written about the best ways to prevent this, code should be clean, or atomic or domain driven etc, but I think one of the simplest ways is to make your code as lazy as possible.

## That’s not my job

All code becomes harder to read the more of it there is and the more logical paths it has to handle. The easiest way to make code easier to read is therefore to reduce the amount of code and the number of logical paths. Since fewer logical paths makes code easier to read, the optimal number is one.

Because none at all would mean that your code does nothing and two is double the complexity!

The easiest way to think of this is that you should write code that is actively trying to not do any work. When your code runs it should check that it has everything it needs and that nothing is stopping it from working. If and only if both of these conditions are fulfilled will the code execute, otherwise the work will be handed off as quickly as possible, because the code is lazy and it doesn't want to do anything.

What the work is handed off to can vary, sometimes it will be a different function:

```typescript
if (callOtherFunction) {
  return otherFunction();
}
```

Or it might be to throw an error:

```typescript
if (failure) {
  throw new Error(“failed”)
}
```

## The return early pattern

A good starting point for achieving lazy code is the return early pattern. The return early pattern is used to improve readability and performance by exiting a function as soon as an invalid state is encountered.

A good example of this is rather than wrapping the entire function in a positive condition if statement, you instead test for the inverse negative condition early and exit the function if true.

For example, when code should only execute if a user is logged in you have two options, test for the positive:

```typescript
fastify.get("/", async (request, reply) => {
  if (userLoggedIn === true) {
    const queryResult = executeDatabaseQuery();
    reply.type("application/json").code(200);
    return queryResult;
  } else {
    reply.code(403);
    return "Please log in";
  }
});
```

Or test for the negative:

```typescript
fastify.get("/", async (request, reply) => {
  if (userLoggedIn === false) {
    reply.code(403);
    return "Please log in";
  }

  const queryResult = executeDatabaseQuery();
  reply.type("application/json").code(200);
  return queryResult;
});
```

By testing for the negative in this instance (and being lazy) our component becomes easier to read. It does not have an unnecessary indentation and the code that executes if the user is not logged in is immediately next to the test of whether the user is logged in, rather than at the opposite other end of the function.

## Separation of concerns

For a more complete example let's look at a simplified frontend component that displays a user’s profile and lets them change their username.

```jsx
const Profile = () => {
  const [username, setUsername] = useState(null);
  const { fetchLoading, fetchError, fetchResult } = fetchProfile();
  const { submitUpdate, updateLoading, updateError, updateResult } =
    updateProfile();

  useEffect(() => {
    if (username == null) {
      setUsername(fetchResult.username);
    }
  }, [fetchResult])

  let error;
  if (fetchError || updateError) {
    error = fetchError || updateError;
    loggingService.log(error);
  }

  const handleButtonClick = () => {
    submitUpdate(username)
  }

  return (
    <div>
      {fetchLoading || updateLoading ? (
        <Spinner />
      ) : error ? (
        <p>{error.message}</p>
      ) : (
        <Input value={username} onChange={setUsername} />
        <Button onClick={handleButtonClick} />
      )}
    </div>
  )
}
```

There is logic to handle an error in the middle of a UI component and the rendered return object has a double nested ternary!

To visualise how this has gone so wrong so fast let's look at how the component works in a logical way:

```d2
load: Awaiting API result / Loading state
error: Display error message
Initial render -> load

load -> Render profile -> Submit modified profile -> load
load -> error
```

We can immediatly see that it isn't being lazy at all, it has three responsibilities:

1. Managing load states
2. Rendering the user profile
3. Handling errors

We know that our code would be cleaner if it was lazy and only had one job so let's re-write our code focusing on just one job. We will separate our concerns.

```jsx
const Profile = () => {
  const [username, setUsername] = useState(null);
  const { fetchLoading, fetchError, fetchResult } = fetchProfile();
  const { submitUpdate, updateLoading, updateError, updateResult } =
    updateProfile();

  if (fetchLoading || updateLoading) {
    return <Spinner />;
  }

  if (fetchError) {
    return <ErrorHandler error={fetchError} />;
  }

  if (updateError) {
    return <ErrorHandler error={updateError} />;
  }

  useEffect(() => {
    if (username == null) {
      setUsername(fetchResult.username);
    }
  }, [fetchResult]);

  const handleButtonClick = () => {
    submitUpdate(username);
  };

  return (
    <div>
      <Input value={username} onChange={setUsername} />
      <Button onClick={handleButtonClick} />
    </div>
  );
};
```

The most obvious change is that we have used the return early pattern to make the `Profile` component try everything it can to not do any work. But we have also created a separate `ErrorHandler` component, this new component is responsible for all handling and rendering of errors.

This is called separation of concerns and is the core of lazy code. As we said earlier the optimum number of logical processes, or things the function is concerned with, in one function, is one. Previously we had three different concerns all within one function, but by separating them our function has become much easier to read and maintain. The branches in the logic are very obvious and neatly gathered at the start of the function, and everything the function needs to do its one job is at the end of the function.

## Conclusion

By using the return early and separation of concerns patterns we can write much lazier code that is easier to read, maintain, extend and debug. By making your code as lazy as possible, you ensure that it does its job and nothing more, which makes doing your job much less. The next time you write a function, ask yourself: Is this code doing more than one job? If so, make it lazy!
