import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/CategoryManager.css';

const CategoryManager = ({ categories, onCategoryChange }) => {
  const [newCategory, setNewCategory] = useState('');

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    
    const userCategoriesRef = doc(db, 'settings', 'categories');
    await updateDoc(userCategoriesRef, {
      list: arrayUnion(newCategory)
    });
    onCategoryChange([...categories, newCategory]);
    setNewCategory('');
  };

  const deleteCategory = async (category) => {
    const userCategoriesRef = doc(db, 'settings', 'categories');
    await updateDoc(userCategoriesRef, {
      list: arrayRemove(category)
    });
    onCategoryChange(categories.filter(c => c !== category));
  };

  return (
    <div className="category-manager">
      <div className="add-category">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New Category Name"
        />
        <button onClick={addCategory}>Add Category</button>
      </div>
      
      <div className="category-list">
        {categories.map(category => (
          <div key={category} className="category-item">
            <span>{category}</span>
            <button onClick={() => deleteCategory(category)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager;
