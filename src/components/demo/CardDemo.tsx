import { type Component } from "solid-js";

export const CardDemo: Component = () => {
  return (
    <div class="p-6 space-y-4">
      <h2 class="text-xl font-bold">Card Component</h2>
      <p class="text-gray-600 mb-4">
        The Card component is a versatile container that can be used to display content with a title, body, and a link.
        It features a hover effect with a gradient background and is commonly used for navigation or highlighting important information.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Note: We're not rendering the actual Card.astro component here since it's an Astro component */}
        {/* This is a representation of how it would look */}
        <div class="link-card">
          <a href="#card-demo">
            <h2>
              Example Card
              <span>&rarr;</span>
            </h2>
            <p>
              This is an example of how the Card component appears with a title and description.
            </p>
          </a>
        </div>

        <div class="link-card">
          <a href="#card-demo-2">
            <h2>
              Another Card
              <span>&rarr;</span>
            </h2>
            <p>
              Cards can be used in grids or lists to organize related content.
            </p>
          </a>
        </div>
      </div>

      <style>
        {`
        .link-card {
          list-style: none;
          display: flex;
          padding: 1px;
          background-color: #23262d;
          background-image: none;
          background-size: 400%;
          border-radius: 7px;
          background-position: 100%;
          transition: background-position 0.6s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        .link-card > a {
          width: 100%;
          text-decoration: none;
          line-height: 1.4;
          padding: calc(1.5rem - 1px);
          border-radius: 8px;
          color: white;
          background-color: #23262d;
          opacity: 0.8;
        }
        h2 {
          margin: 0;
          font-size: 1.25rem;
          transition: color 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        p {
          margin-top: 0.5rem;
          margin-bottom: 0;
        }
        .link-card:is(:hover, :focus-within) {
          background-position: 0;
          background-image: var(--accent-gradient, linear-gradient(45deg, #4f39fa, #da62c4 30%, white 60%));
        }
        .link-card:is(:hover, :focus-within) h2 {
          color: rgb(var(--accent-light, 255, 255, 255));
        }
        `}
      </style>
    </div>
  );
};
