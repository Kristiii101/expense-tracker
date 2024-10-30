import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../config/constants';

const CategorySidebar = ({ currentCategory }) => {
  return (
    <div className="category-sidebar">
      <h3>Categories</h3>
      <ul>
        {CATEGORIES.map(category => (
          <li key={category} className={category === currentCategory ? 'active' : ''}>
            <Link to={`/category/${encodeURIComponent(category)}`}>
              {category}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategorySidebar;
