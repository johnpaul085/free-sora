import { Router } from 'express'
import {
  getCharacters,
  getCharacter,
  createCharacter,
  updateCharacter,
  deleteCharacter,
} from '../controllers/characterController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate) // 所有路由都需要认证

router.get('/', getCharacters)
router.get('/:id', getCharacter)
router.post('/', createCharacter)
router.put('/:id', updateCharacter)
router.delete('/:id', deleteCharacter)

export default router
